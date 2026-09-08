import { CSGOInputHistoryEntryPB, CSGOUserCmdPB } from '../../ts-proto/cs_usercmd.js';
import { CSubtickMoveStep } from '../../ts-proto/usercmd.js';
import {
	DELTA_ROOT_MESSAGE,
	userCmdDeltaSchema,
	type DeltaFieldSpec,
	type DeltaMessageName
} from '../descriptors/generated/userCmdDeltaSchema.js';

/**
 * Decoder for `CMsgServerUserCmd.delta_data`.
 *
 * CS2 sends user commands as deltas against the preceding command for that
 * player slot. The payload looks like protobuf but isn't:
 *
 *  - A field may arrive with **wire type 7**, which is invalid in protobuf and
 *    here means "reset to the declared default". For a nested message that
 *    expands to the whole submessage at defaults, recursively.
 *  - **Repeated message fields** (`input_history`, `subtick_moves`) reuse
 *    protobuf keys as list opcodes, with the element index where the field
 *    number would be: `index << 3 | 7` sets the list length, `index << 3 | 2`
 *    replaces one element. The list carries over from the player's previous
 *    command, so a payload can resize to two entries and resend only the second.
 *  - Absent fields mean "unchanged", so the result is merged onto the baseline.
 *
 * Feeding these bytes to a stock protobuf decoder throws on roughly half of them
 * and silently produces wrong buttons and view angles on the rest.
 *
 * The approach here is to normalise first and decode second: rewrite the delta
 * into valid protobuf (expanding wire-7 resets, lifting out the replacement
 * lists), then hand the result to the generated `CSGOUserCmdPB.decode` so field
 * types come from the real schema rather than a parallel implementation. The
 * field layout comes from `userCmdDeltaSchema`, generated from the `.proto`
 * files, so a protocol change updates it rather than silently invalidating it.
 *
 * Every failure path returns null and leaves the caller's baseline untouched —
 * a partially applied delta is worse than a skipped one.
 */

/** Thrown internally on malformed input; callers see `null`. */
class DeltaFormatError extends Error {}

const fieldSpec = (message: DeltaMessageName, field: number): DeltaFieldSpec | undefined =>
	(userCmdDeltaSchema[message].fields as Record<number, DeltaFieldSpec>)[field];

/**
 * Narrow a schema child reference to a known message. The generator only ever
 * emits names it also emitted definitions for, so a miss means the generated
 * file and this decoder have drifted apart.
 */
const childMessage = (name: string): DeltaMessageName => {
	if (!(name in userCmdDeltaSchema)) throw new DeltaFormatError(`unknown delta message "${name}"`);
	return name as DeltaMessageName;
};

// --- byte-level helpers ------------------------------------------------------

/**
 * Growable byte sink.
 *
 * Backed by a Uint8Array rather than a number[]: sanitising runs once per delta
 * command, several times over for nested messages, and boxing every byte through
 * an array push dominated the cost.
 */
class ByteWriter {
	private buffer = new Uint8Array(256);
	private offset = 0;

	private reserve(extra: number): void {
		const needed = this.offset + extra;
		if (needed <= this.buffer.length) return;
		let capacity = this.buffer.length * 2;
		while (capacity < needed) capacity *= 2;
		const grown = new Uint8Array(capacity);
		grown.set(this.buffer.subarray(0, this.offset));
		this.buffer = grown;
	}

	varint(value: number): void {
		this.reserve(5);
		let v = value >>> 0;
		while (v >= 0x80) {
			this.buffer[this.offset++] = (v & 0x7f) | 0x80;
			v >>>= 7;
		}
		this.buffer[this.offset++] = v;
	}

	push(value: number): void {
		this.reserve(1);
		this.buffer[this.offset++] = value;
	}

	pushMany(values: ArrayLike<number>): void {
		this.reserve(values.length);
		this.buffer.set(values as Uint8Array, this.offset);
		this.offset += values.length;
	}

	pushRange(source: Uint8Array, start: number, count: number): void {
		this.reserve(count);
		this.buffer.set(source.subarray(start, start + count), this.offset);
		this.offset += count;
	}

	/** A view of what has been written. Valid until this writer is used again. */
	toBytes(): Uint8Array {
		return this.buffer.subarray(0, this.offset);
	}
}

class ByteReader {
	offset = 0;
	constructor(readonly bytes: Uint8Array) {}

	get done(): boolean {
		return this.offset >= this.bytes.length;
	}

	varint(): number {
		let result = 0;
		for (let shift = 0; shift < 35; shift += 7) {
			if (this.offset >= this.bytes.length) throw new DeltaFormatError('truncated varint');
			const byte = this.bytes[this.offset++]!;
			if (shift === 28 && byte > 0x0f) throw new DeltaFormatError('uint32 varint overflow');
			result |= (byte & 0x7f) << shift;
			if ((byte & 0x80) === 0) return result >>> 0;
		}
		throw new DeltaFormatError('varint too long');
	}

	/** Copy a varint through to `out` without interpreting it, preserving 64-bit values. */
	copyVarint(out: ByteWriter): void {
		for (let i = 0; i < 10; i++) {
			if (this.offset >= this.bytes.length) throw new DeltaFormatError('truncated varint');
			const byte = this.bytes[this.offset++]!;
			if (i === 9 && byte > 1) throw new DeltaFormatError('uint64 varint overflow');
			out.push(byte);
			if ((byte & 0x80) === 0) return;
		}
		throw new DeltaFormatError('varint too long');
	}

	take(count: number): Uint8Array {
		if (count < 0 || this.offset + count > this.bytes.length) throw new DeltaFormatError('truncated field');
		const slice = this.bytes.subarray(this.offset, this.offset + count);
		this.offset += count;
		return slice;
	}

	/** Copy `count` bytes straight into `out`, skipping the intermediate view. */
	copyInto(out: ByteWriter, count: number): void {
		if (count < 0 || this.offset + count > this.bytes.length) throw new DeltaFormatError('truncated field');
		out.pushRange(this.bytes, this.offset, count);
		this.offset += count;
	}
}

// --- wire-7 reset expansion --------------------------------------------------

const defaultsCache = new Map<DeltaMessageName, Uint8Array>();

/** Every field of `message` written out at its declared default. */
const explicitDefaults = (message: DeltaMessageName): Uint8Array => {
	const cached = defaultsCache.get(message);
	if (cached) return cached;

	const out = new ByteWriter();
	// Guard against a self-referential schema producing unbounded recursion.
	defaultsCache.set(message, new Uint8Array(0));
	for (const [field, spec] of Object.entries(userCmdDeltaSchema[message].fields)) {
		writeDefault(out, Number(field), spec as DeltaFieldSpec);
	}
	const bytes = out.toBytes();
	defaultsCache.set(message, bytes);
	return bytes;
};

/** Write `field` at its declared default, key included. */
const writeDefault = (out: ByteWriter, field: number, spec: DeltaFieldSpec): void => {
	// Repeated fields are handled by list operations. An empty protobuf message
	// would mean a list containing one empty element, not an empty list.
	if (spec.repeated) return;
	out.varint((field << 3) | spec.wire);
	if (spec.wire === 2) {
		// A nested delta-encoded message resets to all of *its* fields at default,
		// so the merge overwrites each one. Anything else resets to empty.
		const nested = spec.child ? explicitDefaults(childMessage(spec.child)) : new Uint8Array(0);
		out.varint(nested.length);
		out.pushMany(nested);
		return;
	}
	out.pushMany(spec.def ?? []);
};

// --- sanitising --------------------------------------------------------------

type ListUpdates = Map<string, Uint8Array[]>;
const RESET_LIST = Uint8Array.of(7); // replacement-list opcode: resize to zero

const appendList = (lists: ListUpdates | undefined, path: string, bytes: Uint8Array): void => {
	if (!lists) throw new DeltaFormatError('nested replacement lists are unsupported');
	let updates = lists.get(path);
	if (!updates) lists.set(path, (updates = []));
	updates.push(bytes);
};

/** A parent reset also clears every repeated field below it. */
const resetLists = (message: DeltaMessageName, path: string, lists: ListUpdates | undefined): void => {
	for (const [field, spec] of Object.entries(userCmdDeltaSchema[message].fields)) {
		const child = spec as DeltaFieldSpec;
		const fieldPath = path ? `${path}.${field}` : field;
		if (child.repeated) appendList(lists, fieldPath, RESET_LIST);
		else if (child.child) resetLists(childMessage(child.child), fieldPath, lists);
	}
};

/**
 * Rewrite one delta message into valid protobuf.
 *
 * Wire-7 fields expand to their defaults; nested delta messages are rewritten
 * recursively; repeated message fields are lifted out into `lists` (keyed by
 * dotted field path) because their replacement-list encoding has no protobuf
 * equivalent.
 */
const sanitize = (bytes: Uint8Array, message: DeltaMessageName, path: string, lists?: ListUpdates) => {
	const reader = new ByteReader(bytes);
	const out = new ByteWriter();

	while (!reader.done) {
		const key = reader.varint();
		const field = key >>> 3;
		const wire = key & 0x07;
		if (field === 0) throw new DeltaFormatError('field number 0');

		const spec = fieldSpec(message, field);

		if (wire === 7) {
			if (!spec) throw new DeltaFormatError(`reset of unknown field ${message}.${field}`);
			if (spec.repeated) {
				appendList(lists, path ? `${path}.${field}` : String(field), RESET_LIST);
				continue;
			}
			if (spec.child) resetLists(childMessage(spec.child), path ? `${path}.${field}` : String(field), lists);
			writeDefault(out, field, spec);
			continue;
		}
		if (spec && wire !== spec.wire) throw new DeltaFormatError(`wrong wire type for ${message}.${field}`);

		switch (wire) {
			case 0:
				out.varint(key);
				reader.copyVarint(out);
				break;
			case 1:
				out.varint(key);
				out.pushMany(reader.take(8));
				break;
			case 5:
				out.varint(key);
				out.pushMany(reader.take(4));
				break;
			case 2: {
				const length = reader.varint();
				if (spec?.repeated && spec.child) {
					// Replacement list — collected, not emitted.
					const fieldPath = path ? `${path}.${field}` : String(field);
					appendList(lists, fieldPath, reader.take(length));
					break;
				}
				if (!spec?.child) {
					// Opaque bytes: copy straight through without materialising a view.
					out.varint(key);
					out.varint(length);
					reader.copyInto(out, length);
					break;
				}
				const rewritten = sanitize(
					reader.take(length),
					childMessage(spec.child),
					path ? `${path}.${field}` : String(field),
					lists
				);
				out.varint(key);
				out.varint(rewritten.length);
				out.pushMany(rewritten);
				break;
			}
			default:
				throw new DeltaFormatError(`unsupported wire type ${wire}`);
		}
	}

	return out.toBytes();
};

// --- replacement lists -------------------------------------------------------

/** Largest repeated-field length a delta may declare, as a sanity bound. */
const MAX_LIST_LENGTH = 4096;

/** Normalize malformed protobuf errors without swallowing errors in the merge. */
const decodePayload = <T>(decode: (bytes: Uint8Array) => T, bytes: Uint8Array): T => {
	try {
		return decode(bytes);
	} catch (error) {
		if (error instanceof Error) throw new DeltaFormatError(error.message);
		throw error;
	}
};

/**
 * Rebuild a repeated field from its delta payloads.
 *
 * The encoding reuses protobuf keys as list opcodes, with the element index in
 * place of the field number:
 *
 *  - `index << 3 | 7` sets the list length to `index` — truncating, or extending
 *    with slots the payload is expected to fill.
 *  - `index << 3 | 2` replaces the element at `index` with the message that
 *    follows.
 *
 * Crucially the list continues from the player's current one rather than from
 * empty: a payload may resize to two entries and resend only the second, leaving
 * the first inherited. Starting empty (and requiring entries from index 0) makes
 * roughly a third of real deltas look malformed.
 *
 * Any slot left unfilled means the payload references history this decoder never
 * saw, so the whole delta is rejected rather than emitting a fabricated entry.
 */
const decodeReplacementList = <T>(
	payloads: Uint8Array[],
	message: DeltaMessageName,
	decode: (bytes: Uint8Array) => T,
	baseline: readonly T[]
): T[] => {
	const items: (T | undefined)[] = [...baseline];

	for (const payload of payloads) {
		const reader = new ByteReader(payload);

		while (!reader.done) {
			const key = reader.varint();
			const index = key >>> 3;
			const wire = key & 0x07;

			if (wire === 7) {
				if (index > MAX_LIST_LENGTH) throw new DeltaFormatError('repeated field length out of range');
				items.length = index;
				continue;
			}
			if (wire !== 2) throw new DeltaFormatError(`unsupported repeated opcode (wire ${wire})`);
			if (index >= MAX_LIST_LENGTH) throw new DeltaFormatError('repeated element index out of range');

			const body = reader.take(reader.varint());
			// Elements are delta-encoded too and can carry their own resets.
			items[index] = decodePayload(decode, sanitize(body, message, ''));
		}
	}

	for (let i = 0; i < items.length; i++) {
		if (items[i] === undefined) throw new DeltaFormatError(`repeated element ${i} was never provided`);
	}
	return items as T[];
};

// --- merging -----------------------------------------------------------------

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value) && !ArrayBuffer.isView(value);

/**
 * Overlay the fields a delta actually carried onto a clone of the baseline.
 *
 * `noDefaultsForOptionals` leaves absent protobuf fields `undefined`, which is
 * exactly the "unchanged" signal — so anything defined replaces, and nested
 * messages merge field by field rather than wholesale. Wholesale replacement
 * would wipe view-angle or button components the delta chose not to resend.
 */
const mergeInto = (baseline: unknown, delta: Record<string, unknown>): Record<string, unknown> => {
	const result: Record<string, unknown> = isPlainObject(baseline) ? { ...baseline } : {};

	for (const key of Object.keys(delta)) {
		const value = delta[key];
		// Protobuf decoders initialize repeated fields to [] even when omitted.
		// Only the separately collected list operations may change those fields.
		if (value === undefined || Array.isArray(value)) continue;
		if (isPlainObject(value)) {
			result[key] = mergeInto(result[key], value);
		} else {
			result[key] = value;
		}
	}

	return result;
};

// --- entry point -------------------------------------------------------------

/** Wire field paths of the two replacement lists in CSGOUserCmdPB. */
const INPUT_HISTORY_PATH = '2';
const SUBTICK_MOVES_PATH = '1.18';

/**
 * Apply one `delta_data` payload to a player's baseline command.
 *
 * Returns the reconstructed command, or null if the payload is malformed or uses
 * an encoding this decoder doesn't recognise. The baseline is never mutated;
 * the caller must invalidate its delta chain until the next full command.
 */
export const applyUserCmdDelta = (baseline: CSGOUserCmdPB, deltaData: Uint8Array): CSGOUserCmdPB | null => {
	try {
		const lists = new Map<string, Uint8Array[]>();
		const sanitized = sanitize(deltaData, DELTA_ROOT_MESSAGE, '', lists);
		const delta = decodePayload(CSGOUserCmdPB.decode, sanitized);

		const merged = mergeInto(baseline, delta as unknown as Record<string, unknown>) as unknown as CSGOUserCmdPB;

		const inputHistory = lists.get(INPUT_HISTORY_PATH);
		if (inputHistory) {
			merged.input_history = decodeReplacementList(
				inputHistory,
				'CSGOInputHistoryEntryPB',
				bytes => CSGOInputHistoryEntryPB.decode(bytes),
				baseline.input_history ?? []
			);
		} else {
			merged.input_history = baseline.input_history ?? [];
		}

		const subtickMoves = lists.get(SUBTICK_MOVES_PATH);
		if (subtickMoves) {
			if (!merged.base) merged.base = {} as NonNullable<CSGOUserCmdPB['base']>;
			merged.base.subtick_moves = decodeReplacementList(
				subtickMoves,
				'CSubtickMoveStep',
				bytes => CSubtickMoveStep.decode(bytes),
				baseline.base?.subtick_moves ?? []
			);
		} else if (delta.base) {
			merged.base!.subtick_moves = baseline.base?.subtick_moves ?? [];
		}

		return merged;
	} catch (error) {
		if (error instanceof DeltaFormatError || error instanceof RangeError) return null;
		throw error;
	}
};

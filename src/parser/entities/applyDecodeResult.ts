/**
 * Applies a `DecodeResultJs` (produced by `EntityDecoderNative.parseEntityPacket`)
 * to a `DemoReader.entities` array and pushes the matching `entitycreated`,
 * `entityupdated`, `entitydeleted` events through the parse session's event
 * queue. The wire format mirrors `crates/native/src/entity_parser.rs` exactly.
 *
 * Used by `ParseSession` when the Rust decoder feature flag is on (Phase 6+).
 */
import type { emit } from './types.js';
import type { TypedEntity } from '../../generated/entityTypes.js';
import type { DecodeResultJs } from 'cs2parser-native';

type DecodeResult = DecodeResultJs;

const TAG_CREATE = 1;
const TAG_UPDATE = 2;
const TAG_DELETE = 3;

const VK_BOOL = 0;
const VK_I32 = 1;
const VK_U32 = 2;
const VK_F32 = 3;
const VK_VEC3 = 4;
const VK_U64 = 5;
const VK_STRING = 6;
const VK_BLOB = 7;

function readValue(
	kind: number,
	idx: number,
	f64s: ArrayLike<number>,
	bigints: ArrayLike<bigint>,
	strings: string[],
	blobs: Uint8Array[]
): unknown {
	switch (kind) {
		case VK_BOOL:
			return f64s[idx] !== 0;
		case VK_I32:
		case VK_U32:
		case VK_F32:
			return f64s[idx];
		case VK_VEC3:
			return [f64s[idx], f64s[idx + 1], f64s[idx + 2]];
		case VK_U64:
			return bigints[idx];
		case VK_STRING:
			return strings[idx];
		case VK_BLOB:
			return blobs[idx];
		default:
			throw new Error(`unknown valueKind ${kind}`);
	}
}

interface ApplyContext {
	entities: TypedEntity[];
	propIdToName: Record<number, string>;
	directWriteMode: boolean;
	enqueue: emit;
	onlyGameRules: boolean;
}

/**
 * Walk the ops byte stream and apply each CREATE / UPDATE / DELETE to
 * `entities`, mirroring the JS EntityParser's direct-write / event-emit logic.
 */
export function applyDecodeResult(result: DecodeResult, ctx: ApplyContext): void {
	const opsBuf = result.ops;
	const view = new DataView(opsBuf.buffer, opsBuf.byteOffset, opsBuf.byteLength);
	const f64s = result.f64Values;
	const bigints = result.bigintValues;
	const strings = result.strings;
	const blobs = result.blobs as Uint8Array[];
	const classNames = result.classNames;

	let off = 0;
	const len = opsBuf.length;

	while (off < len) {
		const tag = view.getUint8(off);
		off += 1;
		if (tag === TAG_DELETE) {
			const entityId = view.getUint32(off, true);
			off += 4;
			ctx.entities[entityId] = undefined as unknown as TypedEntity;
			ctx.enqueue('entitydeleted', entityId);
			continue;
		}
		if (tag === TAG_CREATE) {
			const entityId = view.getUint32(off, true);
			off += 4;
			const classId = view.getUint32(off, true);
			off += 4;
			const entityType = view.getUint8(off);
			off += 1;
			const classNameIdx = view.getUint32(off, true);
			off += 4;
			const updateCount = view.getUint32(off, true);
			off += 4;
			const className = classNames[classNameIdx]!;
			// Allocate the entity record before writing properties — the
			// 'entitycreated' listener in DemoReader can read properties
			// synchronously inside the event handler, so they must be in
			// place by the time we emit (matches the JS direct-write order).
			ctx.entities[entityId] = {
				classId,
				entityType: entityType as TypedEntity['entityType'],
				className,
				properties: {}
			} as TypedEntity;
			for (let i = 0; i < updateCount; i++) {
				const propId = view.getUint32(off, true);
				off += 4;
				const kind = view.getUint8(off);
				off += 1;
				const valIdx = view.getUint32(off, true);
				off += 4;
				const name = ctx.propIdToName[propId];
				if (name !== undefined) {
					(ctx.entities[entityId]!.properties as Record<string, unknown>)[name] = readValue(
						kind,
						valIdx,
						f64s,
						bigints,
						strings,
						blobs
					);
				}
			}
			ctx.enqueue('entitycreated', [entityId, classId, entityType as never, className]);
			continue;
		}
		if (tag === TAG_UPDATE) {
			const entityId = view.getUint32(off, true);
			off += 4;
			const updateCount = view.getUint32(off, true);
			off += 4;
			const ent = ctx.entities[entityId];
			const props = ent?.properties as Record<string, unknown> | undefined;
			for (let i = 0; i < updateCount; i++) {
				const propId = view.getUint32(off, true);
				off += 4;
				const kind = view.getUint8(off);
				off += 1;
				const valIdx = view.getUint32(off, true);
				off += 4;
				const value = readValue(kind, valIdx, f64s, bigints, strings, blobs);
				const name = ctx.propIdToName[propId];
				if (ctx.directWriteMode) {
					if (props && name !== undefined) props[name] = value;
				} else {
					ctx.enqueue('entityupdated', { entityId, propId, value });
				}
			}
			continue;
		}
		throw new Error(`unknown op tag ${tag}`);
	}
}

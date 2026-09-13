import { describe, expect, test } from 'bun:test';
import { BinaryWriter } from '@bufbuild/protobuf/wire';
import { applyUserCmdDelta } from '../../src/parser/entities/userCmdDelta.js';
import {
	userCmdDeltaSchema,
	type DeltaFieldSpec,
	type DeltaMessageName
} from '../../src/parser/descriptors/generated/userCmdDeltaSchema.js';
import { CSGOUserCmdPB } from '../../src/ts-proto/cs_usercmd.js';

const bytes = (...values: number[]) => Uint8Array.from(values);
const key = (field: number, wire: number): number[] => [...new BinaryWriter().uint32(field * 8 + wire).finish()];
const fieldBytes = (field: number, body: readonly number[]): number[] => [
	...key(field, 2),
	...new BinaryWriter().uint32(body.length).finish(),
	...body
];
const concat = (...parts: readonly number[][]): Uint8Array => bytes(...parts.flat());

const defaults = (message: DeltaMessageName): number[] =>
	Object.entries(userCmdDeltaSchema[message].fields).flatMap(([field, value]) => {
		const spec = value as DeltaFieldSpec;
		if (spec.repeated) return [];
		if (spec.wire === 2) return fieldBytes(+field, spec.child ? defaults(spec.child as DeltaMessageName) : []);
		return [...key(+field, spec.wire), ...spec.def!];
	});

// Independent reference overlay: field values and optional presence come from
// the generated protobuf decoder, not a second scalar decoder in the test.
const overlay = (previous: unknown, patch: unknown): Record<string, unknown> => {
	const result = { ...(previous as Record<string, unknown>) };
	for (const [name, value] of Object.entries(patch as Record<string, unknown>)) {
		if (value === undefined || Array.isArray(value)) continue;
		result[name] =
			value && typeof value === 'object' && !(value instanceof Uint8Array) ? overlay(result[name], value) : value;
	}
	return result;
};

const baseline = (): CSGOUserCmdPB => ({
	input_history: [{ render_tick_count: 123, view_angles: { x: 4, y: 5, z: 6 } }],
	attack1_start_history_index: 9,
	base: {
		client_tick: 100,
		forwardmove: 0.5,
		viewangles: { x: 1, y: 2, z: 3 },
		buttons_pb: { buttonstate1: '123', buttonstate2: '456', buttonstate3: '789' },
		move_crc: bytes(1, 2, 3),
		subtick_moves: [{ button: '32', pressed: true, when: 0.25 }]
	}
});

const freeze = (value: unknown): void => {
	if (!value || typeof value !== 'object' || ArrayBuffer.isView(value)) return;
	Object.freeze(value);
	Object.values(value).forEach(freeze);
};

describe('usercmd delta generated-protobuf differential', () => {
	test('covers every schema field, scalar boundary, nested reset, and replacement message', () => {
		let seed = 0x8196089;
		const random = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0);
		const varints = [
			0n,
			1n,
			127n,
			128n,
			0x7fffffffn,
			0x80000000n,
			0xffffffffn,
			1n << 53n,
			1n << 63n,
			(1n << 64n) - 1n
		];
		const floats = [0, -0, 1.25, -3.5, Infinity, -Infinity, NaN, 2 ** -149];
		const make = (message: DeltaMessageName): [number[], number[]] => {
			const delta: number[] = [],
				proto: number[] = [];
			for (const [field, value] of Object.entries(userCmdDeltaSchema[message].fields)) {
				const spec = value as DeltaFieldSpec;
				const reset = random() % 5 === 0;
				let body: number[], deltaBody: number[];
				if (spec.child) {
					[deltaBody, body] = make(spec.child as DeltaMessageName);
				} else {
					const writer = new BinaryWriter();
					body =
						spec.wire === 0
							? [...writer.uint64(varints[random() % varints.length]!).finish()]
							: spec.wire === 5
								? [...writer.float(floats[random() % floats.length]!).finish()]
								: [0, 127, 128, 255, random() & 255];
					deltaBody = body;
				}
				if (reset) {
					delta.push(...key(+field, 7));
					if (spec.repeated) continue;
					body = spec.child ? defaults(spec.child as DeltaMessageName) : [...(spec.def ?? [])];
				} else if (spec.repeated) {
					delta.push(...fieldBytes(+field, [...key(1, 7), ...fieldBytes(0, deltaBody)]));
				} else {
					delta.push(
						...(spec.wire === 2 ? fieldBytes(+field, deltaBody) : [...key(+field, spec.wire), ...deltaBody])
					);
				}
				proto.push(...(spec.wire === 2 ? fieldBytes(+field, body) : [...key(+field, spec.wire), ...body]));
			}
			return [delta, proto];
		};
		const previous = baseline();
		freeze(previous);
		const snapshot = structuredClone(previous);
		for (let i = 0; i < 200; i++) {
			const [delta, proto] = make('CSGOUserCmdPB');
			const decoded = CSGOUserCmdPB.decode(bytes(...proto));
			const expected = overlay(previous, decoded) as unknown as CSGOUserCmdPB;
			expected.input_history = decoded.input_history;
			expected.base!.subtick_moves = decoded.base!.subtick_moves;
			expect(applyUserCmdDelta(previous, bytes(...delta))).toStrictEqual(expected);
		}
		expect(previous).toStrictEqual(snapshot);
	});

	test('duplicate singular messages use the last occurrence, including reset/patch ordering', () => {
		const previous = baseline();
		const angleX = fieldBytes(4, [13, 0, 0, 128, 63]);
		const angleY = fieldBytes(4, [21, 0, 0, 0, 64]);
		const cases: [number[], number[]][] = [
			[
				[...fieldBytes(1, angleX), ...fieldBytes(1, angleY)],
				[...fieldBytes(1, angleX), ...fieldBytes(1, angleY)]
			],
			[fieldBytes(1, [...angleX, ...angleY]), fieldBytes(1, [...angleX, ...angleY])],
			[fieldBytes(1, [39, ...angleY]), fieldBytes(1, [...fieldBytes(4, defaults('CMsgQAngle')), ...angleY])],
			[fieldBytes(1, [...angleX, 39]), fieldBytes(1, [...angleX, ...fieldBytes(4, defaults('CMsgQAngle'))])]
		];
		for (const [delta, proto] of cases) {
			const expected = overlay(previous, CSGOUserCmdPB.decode(bytes(...proto))) as unknown as CSGOUserCmdPB;
			expected.base!.subtick_moves = previous.base!.subtick_moves;
			expect(applyUserCmdDelta(previous, bytes(...delta))).toStrictEqual(expected);
		}
	});

	test('accepts validated unknown fields and noncanonical keys/lengths without interpreting opaque bodies', () => {
		const unknown = concat(
			key(99, 0),
			[255, 255, 255, 255, 255, 255, 255, 255, 255, 1],
			key(100, 1),
			Array(8).fill(255),
			key(101, 5),
			[1, 2, 3, 4],
			fieldBytes(102, [0, 255, 7])
		);
		const previous = baseline();
		expect(applyUserCmdDelta(previous, unknown)).toStrictEqual(previous);
		// Overlong but uint32-bounded key, nested length, and scalar value.
		const delta = bytes(0x8a, 0, 0x83, 0, 0x10, 0x81, 0);
		const expected = overlay(previous, CSGOUserCmdPB.decode(delta)) as unknown as CSGOUserCmdPB;
		expect(applyUserCmdDelta(previous, delta)).toStrictEqual(expected);
	});
});

describe('usercmd delta ownership and ordered failures', () => {
	test.each([false, true])(
		'retains owned bytes through source mutation, scratch reuse and growth (rewrite=%s)',
		rewrite => {
			const previous = baseline();
			freeze(previous);
			const snapshot = structuredClone(previous);
			const payload = concat(fieldBytes(1, [...fieldBytes(19, [11, 12, 13, 14]), ...(rewrite ? [31] : [])]));
			const source = Buffer.alloc(payload.length + 17, 255);
			source.set(payload, 7);
			const result = applyUserCmdDelta(previous, source.subarray(7, 7 + payload.length))!;
			const retained = structuredClone(result);
			source.fill(0);
			for (const size of [0, 1024, 70000, 3]) {
				const next = concat(fieldBytes(1, [...fieldBytes(19, Array(size).fill(99)), 31]));
				expect(applyUserCmdDelta(previous, next)?.base?.move_crc?.length).toBe(size);
			}
			expect(result).toStrictEqual(retained);
			result.base!.move_crc!.fill(44);
			expect(previous).toStrictEqual(snapshot);
		}
	);

	test('list patches accumulate across duplicate parents and later scalar occurrences', () => {
		const previous = baseline();
		freeze(previous);
		const replace = fieldBytes(18, fieldBytes(0, [8, 9]));
		const result = applyUserCmdDelta(previous, concat(fieldBytes(1, replace), fieldBytes(1, [16, 42])))!;
		expect(result.base!.client_tick).toBe(42);
		expect(result.base!.subtick_moves[0]!.button).toBe('9');
		expect(result.base!.subtick_moves[0]!.pressed).toBeUndefined();
		const resetThenPatch = applyUserCmdDelta(previous, concat([15], fieldBytes(1, [...replace, 16, 42])))!;
		expect(resetThenPatch.base!.subtick_moves).toStrictEqual(result.base!.subtick_moves);
		// The later base occurrence replaces the reset's scalar defaults, not its list reset.
		expect(resetThenPatch.base!.forwardmove).toBe(previous.base!.forwardmove);
		expect(applyUserCmdDelta(previous, concat(fieldBytes(1, replace), [15]))?.base?.subtick_moves).toEqual([]);
	});

	test('checks holes after all payloads, allowing later fills or truncation but not discarded malformed entries', () => {
		const previous = baseline();
		freeze(previous);
		const grow = fieldBytes(2, key(2, 7));
		const fill = fieldBytes(2, fieldBytes(1, [32, 42]));
		expect(applyUserCmdDelta(previous, concat(grow, fill))?.input_history[1]!.render_tick_count).toBe(42);
		expect(applyUserCmdDelta(previous, concat(grow, [23]))?.input_history).toEqual([]);
		expect(applyUserCmdDelta(previous, concat(fieldBytes(2, fieldBytes(0, [32])), [23]))).toBeNull();
		expect(applyUserCmdDelta(previous, concat(fieldBytes(2, key(4097, 7)), [23]))).toBeNull();
		expect(applyUserCmdDelta(previous, concat(fieldBytes(2, fieldBytes(4096, [])), [23]))).toBeNull();
	});

	test('validates unchanged nested messages and list entries within their own length bounds', () => {
		const previous = baseline();
		for (const delta of [
			fieldBytes(1, fieldBytes(3, [9, ...Array(8).fill(0)])), // buttons: uint64 with wire 1
			fieldBytes(2, fieldBytes(0, [34, 0])), // history: int32 with wire 2
			fieldBytes(2, fieldBytes(0, key(99, 7))),
			[10, 2, 34, 5, 13, 0, 0, 128, 63], // child body extends beyond base
			fieldBytes(2, [2, 1, 32, 1]) // scalar extends beyond the list element
		]) {
			expect(applyUserCmdDelta(previous, bytes(...delta))).toBeNull();
		}
	});

	test.each(
		[
			[...key(99, 0), ...Array(9).fill(128), 2],
			[...key(99, 0), ...Array(10).fill(128), 0],
			[...key(99, 1), 1, 2, 3],
			[...key(99, 5), 1, 2, 3],
			[...key(99, 2), 4, 1],
			[...key(99, 7)],
			[...key(99, 3)],
			[...key(99, 4)],
			[...key(99, 6)],
			...Array.from({ length: 6 }, (_, wire) =>
				wire === 2 ? [10, 128, 128, 128, 128, 16] : [8 + wire, ...Array(8).fill(0)]
			)
		].map(raw => ({ raw }))
	)('rejects malformed/wrong-wire suffix %j without touching retained history', ({ raw }) => {
		const previous = baseline();
		freeze(previous);
		const snapshot = structuredClone(previous);
		// Earlier valid writes must not leak even when a later unknown field fails.
		expect(applyUserCmdDelta(previous, concat(fieldBytes(1, [31, 16, 42]), [23], raw))).toBeNull();
		expect(previous).toStrictEqual(snapshot);
		expect(applyUserCmdDelta(previous, bytes(48, 2))?.attack1_start_history_index).toBe(2);
	});
});

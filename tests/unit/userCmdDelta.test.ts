import { describe, test, expect } from 'bun:test';
import { applyUserCmdDelta } from '../../src/parser/entities/userCmdDelta.js';
import { userCmdDeltaSchema } from '../../src/parser/descriptors/generated/userCmdDeltaSchema.js';
import type { CSGOUserCmdPB } from '../../src/ts-proto/cs_usercmd.js';

const bytes = (...values: number[]) => Uint8Array.from(values);

describe('usercmd delta schema', () => {
	test('matches the wire types and defaults declared in the .proto files', () => {
		const root = userCmdDeltaSchema.CSGOUserCmdPB.fields;
		expect(root[1]).toEqual({ wire: 2, child: 'CBaseUserCmdPB' });
		expect(root[2]).toEqual({ wire: 2, child: 'CSGOInputHistoryEntryPB', repeated: true });
		// attack1_start_history_index defaults to -1, i.e. a 10-byte two's-complement varint.
		expect(root[6]).toEqual({ wire: 0, def: [255, 255, 255, 255, 255, 255, 255, 255, 255, 1] });

		const base = userCmdDeltaSchema.CBaseUserCmdPB.fields;
		expect(base[3]).toEqual({ wire: 2, child: 'CInButtonStatePB' });
		expect(base[4]).toEqual({ wire: 2, child: 'CMsgQAngle' });
		expect(base[5]!.wire).toBe(5); // forwardmove, float
		// pawn_entity_handle defaults to 16777215.
		expect(base[14]).toEqual({ wire: 0, def: [255, 255, 255, 7] });
		expect(base[18]).toEqual({ wire: 2, child: 'CSubtickMoveStep', repeated: true });
	});

	test('covers the nested messages reachable from the root', () => {
		for (const name of [
			'CSGOUserCmdPB',
			'CBaseUserCmdPB',
			'CInButtonStatePB',
			'CMsgQAngle',
			'CSubtickMoveStep',
			'CBaseUserCmdExecutionNotes',
			'CSGOInputHistoryEntryPB'
		] as const) {
			expect(userCmdDeltaSchema[name]).toBeDefined();
		}
	});

	test('resetting buttons writes all declared defaults', () => {
		const result = applyUserCmdDelta({ input_history: [] }, bytes(0x0a, 0x01, 0x1f));
		expect(result?.base?.buttons_pb).toEqual({ buttonstate1: '0', buttonstate2: '0', buttonstate3: '0' });
	});
});

/**
 * Byte fixtures and expectations ported from LaihoE/demoparser's `usercmd_delta`
 * tests (PR #343), which were captured from real CS2 demos. Matching them is a
 * cross-implementation check: two independently written decoders agreeing on the
 * same bytes is much stronger evidence than either one's own round-trip.
 */
describe('applyUserCmdDelta — demoparser fixtures', () => {
	test('merges scalar fields and rebuilds repeated subtick moves', () => {
		const delta = bytes(
			0x0a,
			0x40,
			0x10,
			0xa5,
			0x54,
			0x1a,
			0x06,
			0x08,
			0x90,
			0x08,
			0x10,
			0x80,
			0x08,
			0x22,
			0x0a,
			0x0d,
			0x87,
			0x85,
			0x29,
			0x40,
			0x15,
			0x36,
			0x07,
			0xc7,
			0x42,
			0x35,
			0x00,
			0x00,
			0x80,
			0xbf,
			0x50,
			0xf8,
			0xfb,
			0xa7,
			0xf7,
			0x07,
			0x58,
			0x51,
			0x60,
			0x06,
			0x92,
			0x01,
			0x17,
			0x0f,
			0x02,
			0x14,
			0x08,
			0x80,
			0x08,
			0x10,
			0x01,
			0x1d,
			0x00,
			0x00,
			0xd8,
			0x3e,
			0x45,
			0x3c,
			0x4e,
			0x11,
			0xbf,
			0x4d,
			0xf0,
			0x6a,
			0xd5,
			0x40
		);

		const baseline = {
			input_history: [],
			base: { forwardmove: 0.75, viewangles: { z: 17 }, subtick_moves: [] }
		} as unknown as CSGOUserCmdPB;

		const result = applyUserCmdDelta(baseline, delta);
		expect(result).not.toBeNull();

		const base = result!.base!;
		expect(base.buttons_pb?.buttonstate1).toBe('1040'); // 0x410
		expect(base.buttons_pb?.buttonstate2).toBe('1024'); // 0x400
		// Untouched by the delta — must survive from the baseline.
		expect(base.forwardmove).toBe(0.75);
		expect(base.viewangles?.z).toBe(17);
		// Carried by the delta.
		expect(base.leftmove).toBe(-1);

		expect(base.subtick_moves).toHaveLength(1);
		expect(base.subtick_moves[0]!.button).toBe('1024');
		expect(base.subtick_moves[0]!.pressed).toBe(true);
		expect(base.subtick_moves[0]!.when).toBeCloseTo(0.421875, 6);
	});

	test('expands nested reset markers and preserves omitted fields', () => {
		const delta = bytes(
			0x0a,
			0x12,
			0x10,
			0xa6,
			0x54,
			0x1a,
			0x01,
			0x17,
			0x50,
			0xed,
			0xf1,
			0xc9,
			0xdd,
			0x03,
			0x97,
			0x01,
			0xa8,
			0x01,
			0x80,
			0x01
		);

		const baseline = {
			input_history: [],
			base: {
				forwardmove: 1,
				buttons_pb: { buttonstate1: '1', buttonstate2: '2', buttonstate3: '3' },
				subtick_moves: []
			}
		} as unknown as CSGOUserCmdPB;

		const result = applyUserCmdDelta(baseline, delta);
		expect(result).not.toBeNull();

		const base = result!.base!;
		expect(base.forwardmove).toBe(1);
		// Field 2 of buttons_pb was reset; 1 and 3 were not mentioned at all.
		expect(base.buttons_pb?.buttonstate1).toBe('1');
		expect(base.buttons_pb?.buttonstate2).toBe('0');
		expect(base.buttons_pb?.buttonstate3).toBe('3');
	});

	test('wire-7 resets use declared non-zero defaults', () => {
		const baseline = {
			input_history: [],
			attack1_start_history_index: 4,
			base: { pawn_entity_handle: 123, subtick_moves: [] }
		} as unknown as CSGOUserCmdPB;

		// 0x37 = field 6, wire 7 (reset attack1_start_history_index)
		// 0x0a 0x01 0x77 = base { field 14, wire 7 } (reset pawn_entity_handle)
		const result = applyUserCmdDelta(baseline, bytes(0x37, 0x0a, 0x01, 0x77));
		expect(result).not.toBeNull();
		expect(result!.attack1_start_history_index).toBe(-1);
		expect(result!.base!.pawn_entity_handle).toBe(0x00ffffff);
	});

	test('rejects non-sequential repeated entries without mutating the baseline', () => {
		const baseline = { input_history: [], base: { subtick_moves: [] } } as unknown as CSGOUserCmdPB;
		const snapshot = JSON.stringify(baseline);

		// Entry index 1 with nothing at index 0.
		expect(applyUserCmdDelta(baseline, bytes(0x12, 0x02, 0x0a, 0x00))).toBeNull();
		expect(JSON.stringify(baseline)).toBe(snapshot);
	});
});

describe('applyUserCmdDelta — malformed input', () => {
	test.each([
		['truncated varint', [0x08]],
		['truncated length-delimited body', [0x0a, 0x10, 0x01]],
		['field number zero', [0x00, 0x01]],
		['reset of an unknown field', [0xff, 0x07]],
		['unsupported wire type', [0x0b]]
	])('returns null on %s', (_label, raw) => {
		const baseline = { input_history: [], base: { subtick_moves: [] } } as unknown as CSGOUserCmdPB;
		expect(applyUserCmdDelta(baseline, bytes(...raw))).toBeNull();
	});

	test('an empty delta leaves the baseline unchanged', () => {
		const baseline = {
			input_history: [],
			base: { forwardmove: 0.5, viewangles: { x: 1, y: 2, z: 3 }, subtick_moves: [] }
		} as unknown as CSGOUserCmdPB;

		const result = applyUserCmdDelta(baseline, new Uint8Array(0));
		expect(result).not.toBeNull();
		expect(result!.base!.forwardmove).toBe(0.5);
		expect(result!.base!.viewangles).toEqual({ x: 1, y: 2, z: 3 } as never);
	});

	test('a resize-to-zero opcode empties the list', () => {
		const baseline = {
			input_history: [],
			base: { subtick_moves: [{ button: '1', pressed: true, when: 0.5 }] }
		} as unknown as CSGOUserCmdPB;

		// base { subtick_moves delta payload = [0x07] }, i.e. set length to 0.
		const result = applyUserCmdDelta(baseline, bytes(0x0a, 0x04, 0x92, 0x01, 0x01, 0x07));
		expect(result).not.toBeNull();
		expect(result!.base!.subtick_moves).toEqual([]);
	});

	test('a resize keeps inherited elements the payload does not resend', () => {
		const keep = { button: '1', pressed: true, when: 0.25 };
		const baseline = {
			input_history: [],
			base: { subtick_moves: [keep, { button: '2', pressed: false, when: 0.5 }] }
		} as unknown as CSGOUserCmdPB;

		// Resize to 2 (0x17), then replace only index 1 with { button: 9 }.
		const result = applyUserCmdDelta(baseline, bytes(0x0a, 0x08, 0x92, 0x01, 0x05, 0x17, 0x0a, 0x02, 0x08, 0x09));
		expect(result).not.toBeNull();
		const moves = result!.base!.subtick_moves;
		expect(moves).toHaveLength(2);
		expect(moves[0]).toEqual(keep as never); // inherited, untouched
		expect(moves[1]!.button).toBe('9');
	});

	test('rejects a resize that leaves a slot nothing ever filled', () => {
		const baseline = { input_history: [], base: { subtick_moves: [] } } as unknown as CSGOUserCmdPB;
		// Resize to 2 with an empty baseline and no elements supplied.
		expect(applyUserCmdDelta(baseline, bytes(0x0a, 0x04, 0x92, 0x01, 0x01, 0x17))).toBeNull();
	});
});

describe('applyUserCmdDelta — list presence and resets', () => {
	const baseline = (): CSGOUserCmdPB => ({
		input_history: [{ render_tick_count: 10 }],
		base: { forwardmove: 1, subtick_moves: [{ button: '1', pressed: true, when: 0.5 }] }
	});

	test('omitted lists survive a scalar update without mutating the baseline', () => {
		const previous = baseline();
		const snapshot = structuredClone(previous);
		const result = applyUserCmdDelta(previous, bytes(0x0a, 0x02, 0x10, 0x01));
		expect(result?.base?.client_tick).toBe(1);
		expect(result?.base?.subtick_moves).toEqual(previous.base!.subtick_moves);
		expect(result?.input_history).toEqual(previous.input_history);
		expect(previous).toEqual(snapshot);
	});

	test('the omitted subtick list from NEWEST.dem tick 8 remains inherited', () => {
		const delta = Buffer.from(
			'0a0910b51650c585d7cb031224021020b4162d7dba4d3f30b7163d7a09463f0a1020b5162dadc1bb3d30b8163de9f97b3d',
			'hex'
		);
		const previous = baseline();
		expect(applyUserCmdDelta(previous, delta)?.base?.subtick_moves).toEqual(previous.base!.subtick_moves);
	});

	test('wire-7 resets clear each list without clearing unrelated fields', () => {
		const previous = baseline();
		expect(applyUserCmdDelta(previous, bytes(0x17))?.input_history).toEqual([]);
		const result = applyUserCmdDelta(previous, bytes(0x0a, 0x02, 0x97, 0x01));
		expect(result?.base?.subtick_moves).toEqual([]);
		expect(result?.base?.forwardmove).toBe(1);
		expect(result?.input_history).toEqual(previous.input_history);
	});

	test('resetting the parent clears nested lists and scalar fields', () => {
		const result = applyUserCmdDelta(baseline(), bytes(0x0f));
		expect(result?.base?.subtick_moves).toEqual([]);
		expect(result?.base?.forwardmove).toBe(0);
		expect(result?.input_history).toEqual(baseline().input_history);
	});

	test('list patches and resets retain their wire order', () => {
		// input_history: reset, then replace element 0 with render_tick_count = 20.
		const patch = [0x12, 0x04, 0x02, 0x02, 0x20, 20];
		expect(applyUserCmdDelta(baseline(), bytes(0x17, ...patch))?.input_history).toEqual([
			{ render_tick_count: 20 }
		]);
		expect(applyUserCmdDelta(baseline(), bytes(...patch, 0x17))?.input_history).toEqual([]);
	});

	test.each([
		['overlong scalar varint', [0x30, ...Array(12).fill(0x80), 0]],
		['overflowing field key', [0x80, 0x80, 0x80, 0x80, 0x10]],
		['wrong field wire type', [0x0d, 0, 0, 0, 0]],
		['overflowing scalar varint', [0x30, ...Array(9).fill(0x80), 2]]
	])('rejects %s without mutating its baseline', (_name, raw) => {
		const previous = baseline();
		const snapshot = structuredClone(previous);
		expect(applyUserCmdDelta(previous, bytes(...raw))).toBeNull();
		expect(previous).toEqual(snapshot);
	});
});

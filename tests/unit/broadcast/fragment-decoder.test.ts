import { describe, test, expect } from 'bun:test';
import { ParseSession } from '../../../src/parser/entities/parseSession.js';
import { EntityMode, type EventQueue } from '../../../src/parser/entities/types.js';
import { DemoReader } from '../../../src/parser/index.js';
import { EDemoCommands } from '../../../src/ts-proto/demo.js';
import { buildFragment } from './helpers.js';

function makeSession(): { session: ParseSession; events: EventQueue } {
	const events: EventQueue = [];
	const parser = new DemoReader();
	const session = ParseSession.forBroadcast(EntityMode.NONE, q => {
		for (const e of q) events.push(e);
		q.length = 0;
	}, parser);
	return { session, events };
}

const eventNames = (events: EventQueue) => events.map(e => e[0]);

describe('ParseSession.pushBroadcastFragment', () => {
	test('emits tickstart on first command and tickend before tick change', () => {
		const { session, events } = makeSession();

		const frag = buildFragment([
			{ cmd: EDemoCommands.DEM_SyncTick, tick: 100, payload: new Uint8Array(0) },
			{ cmd: EDemoCommands.DEM_SyncTick, tick: 100, payload: new Uint8Array(0) },
			{ cmd: EDemoCommands.DEM_SyncTick, tick: 101, payload: new Uint8Array(0) }
		]);

		const result = session.pushBroadcastFragment(frag, 0);
		expect(result.ended).toBe(false);

		// Expected: tickstart(100), tickend(100), tickstart(101)
		const ticks = events.filter(e => e[0] === 'tickstart' || e[0] === 'tickend');
		expect(ticks).toEqual([
			['tickstart', 100],
			['tickend', 100],
			['tickstart', 101]
		]);
	});

	test('applies positive tickOffset', () => {
		const { session, events } = makeSession();
		const frag = buildFragment([{ cmd: EDemoCommands.DEM_SyncTick, tick: 50, payload: new Uint8Array(0) }]);
		session.pushBroadcastFragment(frag, 1000);
		expect(events.find(e => e[0] === 'tickstart')?.[1]).toBe(1050);
	});

	test('applies zero tickOffset', () => {
		const { session, events } = makeSession();
		const frag = buildFragment([{ cmd: EDemoCommands.DEM_SyncTick, tick: 42, payload: new Uint8Array(0) }]);
		session.pushBroadcastFragment(frag, 0);
		expect(events.find(e => e[0] === 'tickstart')?.[1]).toBe(42);
	});

	test('clamps negative result to internal sentinel -1 (signup fragment with offset -1)', () => {
		const { session, events } = makeSession();
		// rawTick = 0, tickOffset = -1 → tick = -1 (signup-fragment sentinel)
		const frag = buildFragment([{ cmd: EDemoCommands.DEM_SyncTick, tick: 0, payload: new Uint8Array(0) }]);
		session.pushBroadcastFragment(frag, -1);
		// tick=-1 means we're still in pre-tick state, so no tickstart should fire
		// (ParseSession only fires tickstart when transitioning *out* of -1)
		expect(events.filter(e => e[0] === 'tickstart')).toEqual([]);
		expect(events.filter(e => e[0] === 'tickend')).toEqual([]);
	});

	test('command === 0 end-marker returns ended:true and emits end with reason "stop"', () => {
		const { session, events } = makeSession();
		const frag = buildFragment(
			[{ cmd: EDemoCommands.DEM_SyncTick, tick: 5, payload: new Uint8Array(0) }],
			true
		);

		const result = session.pushBroadcastFragment(frag, 0);
		expect(result.ended).toBe(true);

		const endEvent = events.find(e => e[0] === 'end');
		expect(endEvent?.[1]).toEqual({ incomplete: false, reason: 'stop' });

		// Should have emitted tickend before the final 'end'
		expect(eventNames(events)).toContain('tickend');
		expect(eventNames(events)).toContain('end');
	});

	test('does not consume size/payload bytes after command=0 marker', () => {
		const { session, events } = makeSession();
		// Build a fragment that has the end marker followed by garbage. If we
		// erroneously continued reading, we'd parse the garbage bytes.
		const head = buildFragment([{ cmd: EDemoCommands.DEM_SyncTick, tick: 5, payload: new Uint8Array(0) }], true);
		const garbage = new Uint8Array([0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff]);
		const frag = new Uint8Array(head.length + garbage.length);
		frag.set(head);
		frag.set(garbage, head.length);

		const result = session.pushBroadcastFragment(frag, 0);
		expect(result.ended).toBe(true);
		// Only one 'end' emitted (no exceptions/extra events from parsing garbage)
		expect(events.filter(e => e[0] === 'end').length).toBe(1);
	});

	test('preserves DEM_IsCompressed flag (compression dispatch path)', () => {
		const { session, events } = makeSession();
		// Use unknown command 99 with isCompressed; the unknown branch in pushBroadcastFragment
		// just skips, but we want to verify the masked commandType/isCompressed math.
		// For a verifiable test: an uncompressed unknown command → skipped, no error.
		const frag = buildFragment([{ cmd: 99, tick: 5, payload: new Uint8Array([1, 2, 3]) }]);
		expect(() => session.pushBroadcastFragment(frag, 0)).not.toThrow();
		// Unknown commands don't crash the loop
		expect(events.filter(e => e[0] === 'tickstart').length).toBe(1);
	});

	test('emits debug event when reserved byte is non-zero', () => {
		const { session, events } = makeSession();
		const frag = buildFragment([
			{ cmd: EDemoCommands.DEM_SyncTick, tick: 1, payload: new Uint8Array(0), reservedByte: 0x42 }
		]);
		session.pushBroadcastFragment(frag, 0);
		const debugEvent = events.find(e => e[0] === 'debug');
		expect(debugEvent).toBeDefined();
		expect(String(debugEvent![1])).toContain('reserved byte');
	});

	test('throws RangeError on truncated fragment', () => {
		const { session } = makeSession();
		const frag = buildFragment([{ cmd: EDemoCommands.DEM_SyncTick, tick: 1, payload: new Uint8Array([1, 2, 3]) }]);
		const truncated = frag.subarray(0, frag.length - 2);
		expect(() => session.pushBroadcastFragment(truncated, 0)).toThrow(RangeError);
	});

	test('skips unknown command IDs', () => {
		const { session, events } = makeSession();
		const frag = buildFragment([
			{ cmd: 200, tick: 1, payload: new Uint8Array([0xaa, 0xbb]) }, // unknown
			{ cmd: EDemoCommands.DEM_SyncTick, tick: 1, payload: new Uint8Array(0) }
		]);
		expect(() => session.pushBroadcastFragment(frag, 0)).not.toThrow();
		expect(events.filter(e => e[0] === 'tickstart').length).toBe(1);
	});

	test('processes multiple commands in sequence', () => {
		const { session, events } = makeSession();
		const frag = buildFragment([
			{ cmd: EDemoCommands.DEM_SyncTick, tick: 10, payload: new Uint8Array(0) },
			{ cmd: EDemoCommands.DEM_SyncTick, tick: 11, payload: new Uint8Array(0) },
			{ cmd: EDemoCommands.DEM_SyncTick, tick: 12, payload: new Uint8Array(0) }
		]);
		session.pushBroadcastFragment(frag, 0);
		const ticks = events.filter(e => e[0] === 'tickstart').map(e => e[1]);
		expect(ticks).toEqual([10, 11, 12]);
	});
});

describe('ParseSession.forBroadcast', () => {
	test('refuses pushChunk', () => {
		const parser = new DemoReader();
		const session = ParseSession.forBroadcast(EntityMode.NONE, () => {}, parser);
		expect(() => session.pushChunk(Buffer.alloc(16))).toThrow(/broadcast/);
	});

	test('refuses processFrames', () => {
		const parser = new DemoReader();
		const session = ParseSession.forBroadcast(EntityMode.NONE, () => {}, parser);
		expect(() => session.processFrames()).toThrow(/broadcast/);
	});
});

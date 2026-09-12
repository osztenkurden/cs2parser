import { beforeAll, describe, expect, test } from 'bun:test';
import { BinaryReader } from '@bufbuild/protobuf/wire';
import { createHash } from 'node:crypto';
import { EventEmitter } from 'node:events';
import { existsSync, readFileSync } from 'node:fs';
import { Readable } from 'node:stream';
import { DemoReader, EntityMode } from '../../src/index.js';
import { DemoReader as BrowserReader } from '../../src/browser.js';
import { BitBuffer } from '../../src/parser/ubitreader.js';
import golden from '../fixtures/demo.golden.json';
import {
	canonicalize,
	captureParity,
	chunkedDemo,
	PARITY_CHUNK_SIZES,
	PARITY_MODES,
	PARITY_TICKS,
	sha256,
	type ParityMode,
	type ParityResult
} from '../helpers/parity.js';

describe('portable parity snapshots (no fixture required)', () => {
	test('canonicalization sorts keys and uses unambiguous, lossless value tags', async () => {
		expect(canonicalize({ z: undefined, a: 1n })).toBe('["object",[["a",["bigint","1"]],["z",["undefined"]]]]');
		expect(canonicalize({ b: { z: 2, a: 1 }, a: 3 })).toBe(canonicalize({ a: 3, b: { a: 1, z: 2 } }));
		const values = [
			null,
			undefined,
			false,
			-0,
			0,
			NaN,
			Infinity,
			-Infinity,
			1,
			1n,
			'1',
			9007199254740993n,
			'9007199254740993',
			['bigint', '1'],
			[],
			Array(1),
			[undefined],
			{},
			{ a: undefined },
			[1, 2],
			[2, 1],
			new Uint8Array([1]),
			new Int8Array([1]),
			new Uint8ClampedArray([1]),
			new Uint16Array([1]),
			new Int16Array([1]),
			new Uint32Array([1]),
			new Int32Array([1]),
			new Float32Array([1]),
			new Float64Array([1]),
			new BigInt64Array([1n]),
			new BigUint64Array([1n]),
			new Float64Array([-0]),
			new Float64Array([0]),
			new Float64Array([NaN]),
			new Float64Array([Infinity]),
			new Float64Array([-Infinity]),
			new Uint8Array([1]).buffer,
			new DataView(new Uint8Array([1]).buffer)
		];
		const texts = values.map(canonicalize);
		expect(new Set(texts).size).toBe(values.length);
		expect(new Set(await Promise.all(texts.map(sha256))).size).toBe(values.length);
		expect(await sha256('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
	});

	test('Buffer normalizes to Uint8Array, preserving view boundaries rather than backing storage', () => {
		const bytes = Buffer.from([99, 1, 2, 99]).subarray(1, 3);
		expect(canonicalize(bytes)).toBe(canonicalize(Uint8Array.of(1, 2)));
		expect(canonicalize(bytes)).not.toBe(canonicalize([1, 2]));
		expect(canonicalize(new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength))).toBe(
			canonicalize(new DataView(Uint8Array.of(1, 2).buffer))
		);
	});

	test('rejects cycles and unsupported objects instead of silently hashing empty objects', () => {
		const cyclic: Record<string, unknown> = {};
		cyclic.self = cyclic;
		expect(() => canonicalize(cyclic)).toThrow('Cyclic parity value');
		for (const value of [new Map(), new Set(), new Date(), () => {}, Symbol(), { [Symbol()]: 1 }]) {
			expect(() => canonicalize(value)).toThrow(TypeError);
		}
		const shared = { value: 1 };
		expect(canonicalize([shared, shared])).toBe(canonicalize([{ value: 1 }, { value: 1 }]));
	});

	test('captures mutable checkpoints, final state, players and ordered payloads before hashing', async () => {
		const entity = { className: 'CCSGameRulesProxy', properties: { bytes: Uint8Array.of(1), value: -0 } };
		const reader = Object.assign(new EventEmitter(), {
			currentTick: 1,
			header: { map: 'before' },
			entities: [undefined, entity],
			players: [{ steamid: 9007199254740993n }],
			gameEvents: new EventEmitter()
		});
		const capture = captureParity(reader, 'ALL', [1]);
		const initialEntities = canonicalize([{ id: 1, ...entity }]);
		const initialPlayers = canonicalize(reader.players);
		reader.emit('tickend', 1);
		const payload = { eventid: 1, keys: [{ val_uint64: 123n }] };
		const raw = [{ tick: 1, payload: structuredClone(payload) }];
		reader.emit('gameevent', payload);
		payload.keys[0]!.val_uint64 = 456n;
		raw.push({ tick: 1, payload: structuredClone(payload) });
		reader.emit('gameevent', payload);
		payload.keys.length = 0;
		const round = { event_name: 'round_start', timelimit: 115, fraglimit: 0, objective: '' };
		const roundEnd = {
			event_name: 'round_end',
			winner: 3,
			reason: 7,
			message: 'Bomb_Defused',
			legacy: 0,
			player_count: 10,
			nomusic: 1
		};
		const roundText = canonicalize([
			{ tick: 1, name: 'round_start', payload: { ...round } },
			{ tick: 1, name: 'round_end', payload: { ...roundEnd } }
		]);
		reader.gameEvents.emit('round_start', Object.assign(round, { player: reader }));
		reader.gameEvents.emit('round_end', Object.assign(roundEnd, { team: reader }));
		round.timelimit = 999;
		roundEnd.winner = 2;
		roundEnd.message = 'after';
		entity.properties.bytes[0] = 2;
		reader.players[0]!.steamid = 12n;
		const finalEntities = canonicalize([{ id: 1, ...entity }]);
		const finalPlayers = canonicalize(reader.players);
		const pending = capture.finish();
		entity.properties.bytes[0] = 3;
		reader.players[0]!.steamid = 13n;
		reader.header.map = 'after';
		const result = await pending;
		expect(result.tickCount).toBe(1);
		expect(result.checkpoints[0]!.entities.sha256).toBe(await sha256(initialEntities));
		expect(result.checkpoints[0]!.players.sha256).toBe(await sha256(initialPlayers));
		expect(result.final.entities.sha256).toBe(await sha256(finalEntities));
		expect(result.final.players.sha256).toBe(await sha256(finalPlayers));
		expect(result.headerSha256).toBe(await sha256(canonicalize({ map: 'before' })));
		expect(result.rawGameEvents).toEqual({ count: 2, sha256: await sha256(canonicalize(raw)) });
		expect(result.rawGameEvents.sha256).not.toBe(await sha256(canonicalize(raw.toReversed())));
		expect(result.syntheticRoundEvents).toEqual({ starts: 1, ends: 1, sha256: await sha256(roundText) });
	});

	test('golden corrections are confined to independently verified signed ZigZag wire values', () => {
		expect(golden.version).toBe(1);
		expect(golden.checkpointTicks).toEqual([...PARITY_TICKS]);
		for (const correction of golden.reviewedCorrections.snapshots) {
			const bytes = Uint8Array.from(correction.wireVarint);
			expect(new BinaryReader(bytes).sint32()).toBe(correction.value);
			expect(new BitBuffer(bytes).readVarInt32()).toBe(correction.value);
			const wire = new BinaryReader(bytes).uint32();
			const oldShift = (wire | 0) >> 1;
			expect(wire & 1 ? ~oldShift : oldShift).toBe(correction.masterValue);
			expect(correction.entitiesSha256).not.toBe(
				golden.modes.ALL.checkpoints.find(state => state.tick === correction.tick)!.entities.sha256
			);
		}
	});

	test('chunked Web input preserves every byte including the single-byte header prefix', async () => {
		const bytes = Uint8Array.from({ length: 100 }, (_, i) => i);
		const reader = chunkedDemo(bytes.subarray(3, 99), 7).getReader();
		const chunks: Uint8Array[] = [];
		for (;;) {
			const next = await reader.read();
			if (next.done) break;
			chunks.push(next.value);
		}
		expect(chunks.slice(0, 32).every(chunk => chunk.length === 1)).toBe(true);
		expect(chunks[32]!.length).toBe(7);
		expect(Buffer.concat(chunks)).toEqual(Buffer.from(bytes.subarray(3, 99)));
		for (const size of [0, -1, 1.5, Infinity]) expect(() => chunkedDemo(bytes, size)).toThrow(RangeError);
	});
});

const demoPath = process.env.CS2_DEMO_PATH ?? 'tests/fixtures/demo.dem';

describe.skipIf(!existsSync(demoPath))('real demo deep parser parity', () => {
	let bytes: Buffer;
	let releaseFixture: boolean;
	const server = {} as Record<ParityMode, ParityResult>;
	const expectedRelease = structuredClone(golden.modes);
	// Keep MASTER output intact. Only these audited, wire-proven leaf corrections change the oracle.
	for (const correction of golden.reviewedCorrections.snapshots) {
		expectedRelease.ALL.checkpoints.find(state => state.tick === correction.tick)!.entities.sha256 =
			correction.entitiesSha256;
	}

	beforeAll(async () => {
		bytes = readFileSync(demoPath);
		const hash = createHash('sha256').update(bytes).digest('hex');
		releaseFixture = hash === golden.fixture.sha256;
		if (releaseFixture) expect(bytes.length).toBe(golden.fixture.bytes);
		else console.info(`Non-release demo (${hash}): runtime parity only; release golden does not apply.`);
		for (const mode of PARITY_MODES) {
			const reader = new DemoReader();
			const capture = captureParity(reader, mode);
			const result = await reader.parseDemo(demoPath, { entities: EntityMode[mode] });
			expect(result).toEqual({ status: 'complete' });
			server[mode] = await capture.finish();
		}
	}, 300000);

	for (const mode of PARITY_MODES) {
		test(`${mode}: server path matches the independent release golden when applicable`, () => {
			if (releaseFixture) expect(server[mode]).toEqual(expectedRelease[mode]);
			// For arbitrary demos the path result is the runtime reference, not the wrong release golden.
			expect(server[mode].final.tick).toBeGreaterThan(0);
			expect(server[mode].final.tick).toBe(server.NONE.final.tick);
			expect(server[mode].tickCount).toBe(server.NONE.tickCount);
			expect(server[mode].headerSha256).toBe(server.NONE.headerSha256);
			expect(server[mode].rawGameEvents).toEqual(server.NONE.rawGameEvents);
			expect(server[mode].final.players).toEqual(server.NONE.final.players);
			expect(server[mode].final.players.count).toBeGreaterThan(0);
			expect(server[mode].checkpoints.map(state => [state.tick, state.players])).toEqual(
				server.NONE.checkpoints.map(state => [state.tick, state.players])
			);
		});

		// Cover each mode and browser transport once rather than their cross-product.
		const chunkSize = mode === 'NONE' ? 0 : mode === 'ALL' ? PARITY_CHUNK_SIZES[0] : PARITY_CHUNK_SIZES[2];
		test(`${mode}: browser ${chunkSize ? `Web stream / ${chunkSize} bytes` : 'Uint8Array'} deep parity`, async () => {
			const reader = new BrowserReader();
			const capture = captureParity(reader, mode);
			const view = new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength);
			const source = chunkSize ? chunkedDemo(view, chunkSize) : view;
			expect(await reader.parseDemo(source, { entities: EntityMode[mode] })).toEqual({ status: 'complete' });
			expect(await capture.finish()).toEqual(server[mode]);
		}, 300000);
	}

	for (const [method, source, options] of [
		['Buffer', () => bytes, {}],
		['path stream:false', () => demoPath, { stream: false }],
		['one-chunk Readable', () => Readable.from([bytes]), {}]
	] as const) {
		test(`ALL: server ${method} deep parity`, async () => {
			const reader = new DemoReader();
			const capture = captureParity(reader, 'ALL');
			expect(await reader.parseDemo(source(), { entities: EntityMode.ALL, ...options })).toEqual({
				status: 'complete'
			});
			expect(await capture.finish()).toEqual(server.ALL);
		}, 300000);
	}

	test('skipping unused entities preserves full game-rule state and synthetic payloads', () => {
		expect(server.NONE.final.entities.count).toBe(0);
		expect(server.ALL.final.entities.count).toBeGreaterThan(0);
		expect(server.ONLY_GAME_RULES.final.entities).toEqual(server.ALL.final.gameRules);
		expect(server.ONLY_GAME_RULES.checkpoints.map(state => [state.tick, state.entities])).toEqual(
			server.ALL.checkpoints.map(state => [state.tick, state.gameRules])
		);
		expect(server.ONLY_GAME_RULES.syntheticRoundEvents).toEqual(server.ALL.syntheticRoundEvents);
	});

	test('a one-chunk Readable yields to a timer that cancels exactly once before completion', async () => {
		const reader = new DemoReader();
		const ends: unknown[] = [];
		let timerFinished: Promise<void> | undefined;
		let timerFiredBeforeEnd = false;
		reader.once('header', () => {
			timerFinished = new Promise(resolve => {
				setTimeout(() => {
					timerFiredBeforeEnd = ends.length === 0;
					if (timerFiredBeforeEnd) reader.cancel();
					resolve();
				}, 0);
			});
		});
		reader.on('end', result => ends.push(result));
		const result = await reader.parseDemo(Readable.from([bytes]), { entities: EntityMode.NONE });
		expect(timerFinished).toBeDefined();
		await timerFinished;
		expect(timerFiredBeforeEnd).toBe(true);
		expect(result).toEqual({ status: 'cancelled' });
		expect(ends).toEqual([result]);
	}, 300000);
});

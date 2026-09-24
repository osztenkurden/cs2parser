import fs from 'fs';
import { createHash } from 'node:crypto';
import snappy from 'snappy';
import { describe, test, expect } from 'bun:test';
import { DemoReader } from '../../../src/index.js';
import { HttpBroadcastReader } from '../../../src/broadcast/index.js';
import { EntityMode } from '../../../src/parser/entities/types.js';
import { CDemoPacket, EDemoCommands } from '../../../src/ts-proto/demo.js';
import { buildFragment, type BroadcastCommand } from '../../unit/broadcast/helpers.js';
import { MockBroadcastFetcher, type FragmentResponse } from './mock-fetcher.js';
import { canonicalize } from '../../helpers/parity.js';

const demoPath = process.env.CS2_DEMO_PATH ?? 'tests/fixtures/demo.dem';
const demoAvailable = fs.existsSync(demoPath);
// Replaying a prefix covers signon, FullPackets and several rounds; full-demo parity lives elsewhere.
const LIMIT_TICK = 40000;

const snapshot = (reader: DemoReader) =>
	createHash('sha256')
		.update(
			canonicalize({
				tick: reader.currentTick,
				entities: Object.entries(reader.entities).filter(([, entity]) => entity !== undefined),
				players: reader.players
			})
		)
		.digest('hex');

interface DemoFrame {
	cmd: number; // includes compression bit
	tick: number; // raw demo tick (0xffffffff sentinel for signon)
	payload: Uint8Array;
}

/**
 * Walk a .dem file's frame stream and yield each command's raw bytes.
 * Skips the 16-byte magic prefix; stops at DEM_Stop.
 */
function readDemoFrames(buf: Uint8Array): DemoFrame[] {
	const frames: DemoFrame[] = [];
	let off = 16;
	const len = buf.length;

	const readVarint = (): number => {
		let result = 0;
		let shift = 0;
		let b: number;
		do {
			b = buf[off++]!;
			result |= (b & 0x7f) << shift;
			shift += 7;
		} while ((b & 0x80) !== 0 && shift < 35);
		return result >>> 0;
	};

	while (off < len) {
		const cmd = readVarint();
		const tick = readVarint();
		const size = readVarint();
		const payload = buf.subarray(off, off + size);
		off += size;
		const cmdType = cmd & ~EDemoCommands.DEM_IsCompressed;
		if (cmdType === EDemoCommands.DEM_Stop) break;
		frames.push({ cmd, tick, payload });
	}
	return frames;
}

/**
 * Encode a list of demo frames into the broadcast wire format. Optionally
 * appends a `command === 0` end-of-stream marker.
 *
 * For signup-fragment encoding, signon frames (tick === 0xffffffff) emit raw
 * tick = 0; the consumer applies tickOffset = -1 to recover the -1 sentinel.
 * Gameplay frames pass their tick through unchanged for tickOffset = 0.
 *
 * DEM_Packet/DEM_SignonPacket are unwrapped from their CDemoPacket envelope
 * because broadcasts deliver the raw SVC bit-stream directly (matches
 * demofile-net's `HttpBroadcastReader`/`OnDemoPacket` behavior).
 */
function encodeBroadcast(frames: DemoFrame[], opts: { signon: boolean; endMarker: boolean }): Uint8Array {
	const commands: BroadcastCommand[] = [];
	for (const f of frames) {
		const cmdType = f.cmd & ~EDemoCommands.DEM_IsCompressed;
		const isCompressed = (f.cmd & EDemoCommands.DEM_IsCompressed) !== 0;

		let cmd = f.cmd;
		let payload = f.payload;
		if (cmdType === EDemoCommands.DEM_Packet || cmdType === EDemoCommands.DEM_SignonPacket) {
			const proto = isCompressed ? (snappy.uncompressSync(Buffer.from(payload)) as Buffer) : payload;
			payload = CDemoPacket.decode(proto).data ?? new Uint8Array(0);
			cmd = cmdType;
		}

		const rawTick = opts.signon && f.tick === 0xffffffff ? 0 : f.tick;
		commands.push({ cmd, tick: rawTick, payload });
	}
	return buildFragment(commands, opts.endMarker);
}

const ok = (data: Uint8Array): FragmentResponse => ({ ok: true, data });

describe.skipIf(!demoAvailable)('synthetic broadcast round-trip', () => {
	test('end-to-end: broadcast path reproduces the direct .dem state, players and round events', async () => {
		// Convert a .dem prefix into broadcast wire format
		const buf = fs.readFileSync(demoPath);
		const frames = readDemoFrames(new Uint8Array(buf));

		const isSignon = (f: DemoFrame) => f.tick === 0xffffffff;
		const cmdType = (f: DemoFrame) => f.cmd & ~EDemoCommands.DEM_IsCompressed;

		const signonFrames = frames.filter(f => isSignon(f) && cmdType(f) !== EDemoCommands.DEM_FileHeader);
		const gameplayFrames = frames.filter(f => !isSignon(f) && f.tick <= LIMIT_TICK);
		const lastTick = gameplayFrames.at(-1)!.tick;

		// Baseline: the regular file path, stopped after the last replayed tick
		const baseline = new DemoReader();
		const baselineEvents: string[] = [];
		let baselineState: string | undefined;
		baseline.gameEvents.on('round_start', () => baselineEvents.push('round_start'));
		baseline.gameEvents.on('round_end', () => baselineEvents.push('round_end'));
		baseline.on('tickend', tick => {
			if (tick < lastTick) return;
			baselineState = snapshot(baseline);
			baseline.cancel();
		});
		await baseline.parseDemo(demoPath, { entities: EntityMode.ALL });
		expect(baselineState).toBeDefined();
		expect(baselineEvents.length).toBeGreaterThan(4);

		const startBytes = encodeBroadcast(signonFrames, { signon: true, endMarker: false });
		const fullBytes = encodeBroadcast(gameplayFrames, { signon: false, endMarker: true });

		const fetcher = new MockBroadcastFetcher({
			sync: {
				tick: 0,
				rtdelay: 0,
				rcvage: 0,
				fragment: 1,
				signup_fragment: 0,
				tps: 64,
				protocol: 5
			},
			bytes: {
				'0/start': ok(startBytes),
				'1/full': ok(fullBytes)
			}
		});

		const broadcastParser = new DemoReader();
		const broadcastEvents: string[] = [];
		broadcastParser.gameEvents.on('round_start', () => broadcastEvents.push('round_start'));
		broadcastParser.gameEvents.on('round_end', () => broadcastEvents.push('round_end'));

		const reader = new HttpBroadcastReader(broadcastParser, 'https://example.com/', {
			fetcher,
			entities: EntityMode.ALL,
			deltaThrottle: 0
		});

		await reader.start();
		const terminus = await reader.run();

		expect(terminus.status).toBe('complete');
		expect(broadcastParser.currentTick).toBe(lastTick);
		expect(snapshot(broadcastParser)).toBe(baselineState!);
		expect(broadcastEvents).toEqual(baselineEvents);
	}, 120000);
});

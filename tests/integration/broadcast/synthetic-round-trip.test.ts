import fs from 'fs';
import snappy from 'snappy';
import { describe, test, expect } from 'bun:test';
import { DemoReader } from '../../../src/index.js';
import { HttpBroadcastReader } from '../../../src/broadcast/index.js';
import { EntityMode } from '../../../src/parser/entities/types.js';
import { CDemoPacket, EDemoCommands } from '../../../src/ts-proto/demo.js';
import { writeLEUInt32, writeUVarInt32 } from '../../unit/broadcast/helpers.js';
import { MockBroadcastFetcher, type FragmentResponse } from './mock-fetcher.js';

const demoPath = process.env.CS2_DEMO_PATH ?? 'tests/fixtures/demo.dem';
const demoAvailable = fs.existsSync(demoPath);

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
	const parts: Uint8Array[] = [];
	for (const f of frames) {
		const cmdType = f.cmd & ~EDemoCommands.DEM_IsCompressed;
		const isCompressed = (f.cmd & EDemoCommands.DEM_IsCompressed) !== 0;

		let cmd = f.cmd;
		let payload = f.payload;
		if (cmdType === EDemoCommands.DEM_Packet || cmdType === EDemoCommands.DEM_SignonPacket) {
			const proto = isCompressed
				? (snappy.uncompressSync(Buffer.from(payload)) as Buffer)
				: payload;
			payload = CDemoPacket.decode(proto).data ?? new Uint8Array(0);
			cmd = cmdType;
		}

		parts.push(writeUVarInt32(cmd));
		const rawTick = opts.signon && f.tick === 0xffffffff ? 0 : f.tick;
		parts.push(writeLEUInt32(rawTick));
		parts.push(Uint8Array.of(0));
		parts.push(writeLEUInt32(payload.length));
		parts.push(payload);
	}
	if (opts.endMarker) {
		parts.push(writeUVarInt32(0));
		parts.push(writeLEUInt32(0));
		parts.push(Uint8Array.of(0));
	}
	const total = parts.reduce((s, p) => s + p.length, 0);
	const out = new Uint8Array(total);
	let off = 0;
	for (const p of parts) {
		out.set(p, off);
		off += p.length;
	}
	return out;
}

const ok = (data: Uint8Array): FragmentResponse => ({ ok: true, data });

describe.skipIf(!demoAvailable)('synthetic broadcast round-trip', () => {
	test('end-to-end: broadcast path produces same final tick + entity count as direct .dem parse', async () => {
		// Baseline: parse via the regular file path
		const baseline = new DemoReader();
		const baselineEvents: string[] = [];
		baseline.gameEvents.on('round_start', () => baselineEvents.push('round_start'));
		baseline.gameEvents.on('round_end', () => baselineEvents.push('round_end'));
		await baseline.parseDemo(demoPath, { entities: EntityMode.ALL });
		const baselineTick = baseline.currentTick;
		const baselineEntities = baseline.entities.filter(Boolean).length;

		// Convert .dem into broadcast wire format
		const buf = fs.readFileSync(demoPath);
		const frames = readDemoFrames(new Uint8Array(buf));

		const isSignon = (f: DemoFrame) => f.tick === 0xffffffff;
		const cmdType = (f: DemoFrame) => f.cmd & ~EDemoCommands.DEM_IsCompressed;

		const signonFrames = frames.filter(f => isSignon(f) && cmdType(f) !== EDemoCommands.DEM_FileHeader);
		const gameplayFrames = frames.filter(f => !isSignon(f));

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

		expect(terminus.reason).toBe('stop');
		expect(broadcastParser.currentTick).toBe(baselineTick);
		expect(broadcastParser.entities.filter(Boolean).length).toBe(baselineEntities);
		expect(broadcastEvents).toEqual(baselineEvents);
		expect(broadcastParser.players.length).toBe(baseline.players.length);
		expect(broadcastParser.gameRules !== null).toBe(baseline.gameRules !== null);
	}, 120000);
});

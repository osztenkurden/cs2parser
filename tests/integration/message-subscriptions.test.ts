import { describe, test, expect } from 'bun:test';
import fs from 'fs';
import { DemoReader } from '../../src/index.js';
import type { ParseSettings } from '../../src/parser/entities/parseSession.js';

const demoPath = process.env.CS2_DEMO_PATH ?? 'tests/fixtures/demo.dem';
const demoAvailable = fs.existsSync(demoPath);

/**
 * Parse the first `ticks` ticks and report how many times each listener fired.
 * Cancelling early keeps these cheap — the point is whether a message is decoded
 * at all, not how many of them the demo contains.
 */
const countUntil = async (
	setup: (reader: DemoReader, bump: (key: string) => void) => void,
	opts: ParseSettings = {},
	ticks = 20000
) => {
	const reader = new DemoReader();
	const counts: Record<string, number> = {};
	const bump = (key: string) => {
		counts[key] = (counts[key] ?? 0) + 1;
	};

	setup(reader, bump);
	reader.on('tickstart', tick => {
		if (tick >= ticks) reader.cancel();
	});

	await reader.parseDemo(demoPath, opts);
	return counts;
};

describe.skipIf(!demoAvailable)('message subscriptions', () => {
	test('a listener alone is enough to decode a message', async () => {
		// This used to be a silent no-op: without a matching ParseSettings flag the
		// message was skipped and the listener never fired.
		const counts = await countUntil((reader, bump) => {
			reader.on('net_Tick', () => bump('net_Tick'));
		});

		expect(counts.net_Tick).toBeGreaterThan(0);
	});

	test('messages outside the old curated list are reachable', async () => {
		const counts = await countUntil((reader, bump) => {
			reader.on('GE_SosStartSoundEvent', () => bump('sound'));
			reader.on('svc_ClassInfo', () => bump('classInfo'));
		});

		expect(counts.sound).toBeGreaterThan(0);
		expect(counts.classInfo).toBeGreaterThan(0);
	});

	test('an explicit false overrides a listener', async () => {
		const counts = await countUntil(
			(reader, bump) => {
				reader.on('net_Tick', () => bump('net_Tick'));
			},
			{ net_Tick: false }
		);

		expect(counts.net_Tick).toBeUndefined();
	});

	test('a listener attached mid-parse starts receiving messages', async () => {
		const receivedAt: number[] = [];
		const reader = new DemoReader();

		reader.on('tickstart', tick => {
			if (tick === 5000) reader.on('GE_SosStartSoundEvent', () => receivedAt.push(reader.currentTick));
			if (tick >= 20000) reader.cancel();
		});

		await reader.parseDemo(demoPath);
		expect(receivedAt.length).toBeGreaterThan(0);
		expect(receivedAt.every(tick => tick >= 5000)).toBe(true);
	});

	test('anymessage sees every non-core message, named or not', async () => {
		const names = new Set<string>();
		const unnamed = new Map<number, number>();

		const reader = new DemoReader();
		reader.on('anymessage', msg => {
			if (msg.name) names.add(msg.name);
			else unnamed.set(msg.id, (unnamed.get(msg.id) ?? 0) + 1);
			expect(msg.bytes).toBeInstanceOf(Uint8Array);
		});
		reader.on('tickstart', tick => {
			if (tick >= 20000) reader.cancel();
		});

		await reader.parseDemo(demoPath);

		expect(names.size).toBeGreaterThan(5);

		// An id with no registry entry is still delivered — that's the point of the
		// catch-all. It happens when Valve retires an enum member that older demos
		// still carry (EM_RemoveAllDecals, 138) or adds one the bundled protos
		// predate. What must not happen is the id being silently dropped.
		for (const [id, count] of unnamed) {
			expect(count).toBeGreaterThan(0);
			expect(DemoReader.messageId(String(id))).toBeUndefined();
		}
	});

	test('decoded payloads are real messages, not raw bytes', async () => {
		let sample: unknown = null;
		const reader = new DemoReader();
		reader.on('net_Tick', msg => {
			if (!sample) sample = msg;
			reader.cancel();
		});

		await reader.parseDemo(demoPath);

		expect(sample).not.toBeNull();
		expect(sample).toHaveProperty('tick');
	});
});

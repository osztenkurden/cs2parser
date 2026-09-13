import { expect, spyOn, test } from 'bun:test';
import { DemoReader, EntityMode } from '../../src/index.js';
import { checkpointDemo } from '../helpers/checkpointDemo.js';
import { bytesField, demoFile, demoFrame, varint } from '../helpers/demo.js';
import { oneTick, pausedParser } from '../helpers/pausedParser.js';

test.each(['discovery', 'reconstruction'])(
	'cached %s yields after 16 ms and can be cancelled by a timer',
	async phase => {
		const bytes = demoFile(
			...Array.from({ length: 100 }, (_, tick) => demoFrame(10, undefined, tick)),
			demoFrame(0, undefined, 100)
		);
		const { reader, parsing } = await pausedParser(bytes, { entities: EntityMode.NONE });
		if (phase === 'reconstruction') await reader.seekTo(99);
		await reader.seekTo(0);
		let ticks = 0;
		reader.once('tickstart', () => ticks++);
		let now = performance.now();
		let clockCalls = 0;
		const clock = spyOn(performance, 'now').mockImplementation(() => {
			clockCalls++;
			return (now += 4);
		});
		const abort = new AbortController();
		const timer = setTimeout(() => abort.abort(), 0);
		try {
			expect(await reader.seekTo(99, { signal: abort.signal })).toEqual({ status: 'cancelled' });
			expect(clockCalls).toBeLessThanOrEqual(7);
			expect(reader.isPaused).toBe(true);
			expect(reader.isSeeking).toBe(false);
			expect(ticks).toBe(0);
			expect(reader.listeners('tickstart')).toHaveLength(1);
			expect(() => reader.resume()).toThrow('did not complete');
		} finally {
			clock.mockRestore();
			clearTimeout(timer);
		}
		expect(await reader.seekTo(99)).toEqual({ status: 'complete', tick: 99 });
		expect(await oneTick(reader)).toBe(99);
		expect(ticks).toBe(1);
		reader.cancel();
		await parsing;
	}
);

test('aborting from final seek progress cannot report a successful reconstruction', async () => {
	const { reader, parsing } = await pausedParser(demoFile(demoFrame(10, undefined, 0), demoFrame(0, undefined, 1)));
	await reader.seekTo(0);
	const abort = new AbortController();
	reader.once('progress', () => abort.abort());
	expect(await reader.seekTo(0, { signal: abort.signal })).toEqual({ status: 'cancelled' });
	expect(reader.isPaused).toBe(true);
	expect(() => reader.resume()).toThrow('did not complete');
	reader.cancel();
	await parsing;
});

test('seek headers spanning every byte of a read-ahead boundary stay bounded', async () => {
	const tick = 0x10000000;
	// Legal five-byte encodings for all three fields, including non-minimal encodings.
	const header = Uint8Array.from([0x8a, 0x80, 0x80, 0x80, 0, ...varint(tick), 0x80, 0x80, 0x80, 0x80, 0]);
	for (let split = 1; split < header.length; split++) {
		const bytes = demoFile(
			demoFrame(10, new Uint8Array(16384 - 16 - 4 - split), 0),
			header,
			demoFrame(0, undefined, tick + 1)
		);
		const reads: [number, number][] = [];
		const { reader, parsing } = await pausedParser({
			size: bytes.length,
			async read(offset, length, signal) {
				signal?.throwIfAborted();
				expect(offset).toBeGreaterThanOrEqual(0);
				expect(length).toBeGreaterThan(0);
				expect(offset + length).toBeLessThanOrEqual(bytes.length);
				reads.push([offset, length]);
				return bytes.subarray(offset, offset + length);
			}
		});
		expect(await reader.seekTo(tick)).toEqual({ status: 'complete', tick });
		expect(reads[0]).toEqual([0, 16384]);
		expect(reads.every(([, length]) => length <= 16384)).toBe(true);
		const ticks: number[] = [];
		reader.on('tickstart', value => ticks.push(value));
		reader.resume();
		expect(await parsing).toEqual({ status: 'complete' });
		expect(ticks).toEqual([tick, tick + 1]);
	}
});

test('cached seek headers reject truncated and overflowing varints in every field', async () => {
	for (const prefix of [[], [10], [10, 0]]) {
		for (const invalid of [
			[0x80],
			[0x80, 0x80, 0x80, 0x80],
			[0x80, 0x80, 0x80, 0x80, 0x10],
			[0x80, 0x80, 0x80, 0x80, 0x80]
		]) {
			const { reader, parsing } = await pausedParser(demoFile(Uint8Array.from([...prefix, ...invalid])));
			if (invalid.length < 5) expect(await reader.seekTo(1)).toEqual({ status: 'incomplete' });
			else await expect(reader.seekTo(1)).rejects.toThrow('Invalid frame varint');
			reader.cancel();
			await parsing;
		}
	}
	const { reader, parsing } = await pausedParser(demoFile(demoFrame(10, new Uint8Array(2049), 0)), {
		maxFrameBytes: 2048
	});
	await expect(reader.seekTo(1)).rejects.toThrow('maxFrameBytes');
	reader.cancel();
	await parsing;
});

test.each(['complete', 'incomplete', 'cancelled', 'error'] as const)(
	'terminal %s detaches seek input and metadata, retaining public world and diagnostics',
	async status => {
		const full = checkpointDemo();
		const bytes = status === 'incomplete' ? full.subarray(0, -3) : full;
		const { reader, parsing } = await pausedParser(bytes);
		expect(await reader.seekTo(41)).toEqual({ status: 'complete', tick: 41 });
		const internal = reader as any;
		const session = internal._seekSession;
		expect(session.commands.cache.length).toBeGreaterThan(0);
		expect(session.commands.source).toBeDefined();
		expect(session.seed).toBeDefined();
		const entities = reader.entities;
		const header = reader.header;
		const players = reader.players;
		const propNames = reader.propIdToName;
		const fullPackets = reader.fullPackets;
		const bytesRead = reader.seekBytesRead;
		const memoryBytes = reader.seekMemoryBytes;
		const error = new Error('tick observer failed');
		let ended = 0;
		reader.once('end', () => {
			ended++;
			expect(internal._seekSession).toBeUndefined();
			expect(reader.seekBytesRead).toBe(bytesRead);
			expect(reader.seekMemoryBytes).toBe(memoryBytes);
		});
		if (status === 'cancelled') reader.cancel();
		else {
			if (status === 'error')
				reader.once('tickstart', () => {
					throw error;
				});
			reader.resume();
		}
		if (status === 'error') await expect(parsing).rejects.toBe(error);
		else expect(await parsing).toEqual({ status });
		expect(ended).toBe(1);
		expect(internal._seekSession).toBeUndefined();
		expect(reader.currentTick).toBe(status === 'complete' ? 42 : status === 'cancelled' ? 40 : 41);
		expect(reader.entities).toBe(entities);
		expect(reader.entities[1]?.className).toBe('CCSPlayerPawn');
		expect(reader.header).toBe(header);
		expect(reader.players).toBe(players);
		expect(reader.players[1]?.name).toBe('Beta');
		expect(reader.propIdToName).toBe(propNames);
		expect(reader.fullPackets).toEqual(fullPackets);
		expect(Object.isFrozen(reader.fullPackets)).toBe(true);
		expect(reader.seekBytesRead).toBe(bytesRead);
		expect(reader.seekMemoryBytes).toBe(memoryBytes);
		expect(reader.isSeeking).toBe(false);
		expect(reader.isPaused).toBe(false);
		expect(internal._internalEvents.listenerCount('cancel')).toBe(0);
		expect(session.commands.cache.length).toBe(0);
		expect(session.commands.carry.length).toBe(0);
		expect(session.commands.source).toBeUndefined();
		expect(session.commands.pending).toBeUndefined();
		expect(session.seed).toBeUndefined();
		session.dispose();
		expect(reader.fullPackets).toEqual(fullPackets);
	}
);

test('sequential carry storage is reused without mutating retained event bytes or source input', async () => {
	const values = Array.from({ length: 8 }, (_, i) => new Uint8Array(190000 + i).fill(i + 1));
	const bytes = demoFile(
		...values.map((value, tick) => demoFrame(10, bytesField(2, value), tick)),
		demoFrame(0, undefined, 8)
	);
	const original = bytes.slice();
	const retained: Uint8Array[] = [];
	const carries: ArrayBufferLike[] = [];
	const reader = new DemoReader();
	reader.on('DEM_CustomData', value => retained.push(value.data!));
	reader.on('tickend', () => {
		const carry = (reader as any)._seekSession.commands.carry as Uint8Array;
		if (carry.length) carries.push(carry.buffer);
	});
	expect(await reader.parseDemo(bytes)).toEqual({ status: 'complete' });
	expect(retained).toEqual(values);
	expect(bytes).toEqual(original);
	expect(carries.length).toBeGreaterThan(2);
	expect(new Set(carries).size).toBeLessThan(carries.length);
});

test('cancellation cannot repopulate the input cache from a late source read', async () => {
	const bytes = demoFile(demoFrame(10, new Uint8Array(65536), 0), demoFrame(0, undefined, 1));
	const reader = new DemoReader();
	let release!: () => void;
	let entered!: () => void;
	const started = new Promise<void>(resolve => {
		entered = resolve;
	});
	const parsing = reader.parseDemo({
		size: bytes.length,
		async read(offset, length) {
			entered();
			await new Promise<void>(resolve => {
				release = resolve;
			});
			return bytes.subarray(offset, offset + length);
		}
	});
	await started;
	const internal = reader as any;
	const session = internal._seekSession;
	reader.cancel();
	release();
	expect(await parsing).toEqual({ status: 'cancelled' });
	expect(internal._seekSession).toBeUndefined();
	expect(internal._internalEvents.listenerCount('cancel')).toBe(0);
	expect(session.commands.source).toBeUndefined();
	expect(session.commands.cache.length).toBe(0);
	expect(reader.seekBytesRead).toBe(0);
});

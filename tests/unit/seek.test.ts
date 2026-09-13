import { expect, test } from 'bun:test';
import { DemoReader, EntityMode, blobDemoSource } from '../../src/index.js';
import { checkpointDemo } from '../helpers/checkpointDemo.js';
import { pausedParser, oneTick } from '../helpers/pausedParser.js';

const source = (bytes: Uint8Array = checkpointDemo()) => blobDemoSource(new Blob([Uint8Array.from(bytes)]));

test('repeated seeks reuse cached source bytes', async () => {
	const src = source();
	let reads = 0;
	const { reader, parsing } = await pausedParser({
		size: src.size,
		async read(offset, length, signal) {
			reads++;
			return src.read(offset, length, signal);
		}
	});
	expect(await reader.seekTo(41)).toEqual({ status: 'complete', tick: 41 });
	const firstReads = reads;
	expect(firstReads).toBeGreaterThan(0);
	for (const tick of [11, 41]) {
		expect(await reader.seekTo(tick)).toEqual({ status: 'complete', tick });
		expect(reads).toBe(firstReads);
	}
	reader.cancel();
	await parsing;
});

test('invalid raw demo signatures reject seeking before emitting ticks', async () => {
	const bytes = checkpointDemo();
	bytes[0] = 0;
	let ticks = 0;
	const { reader, parsing } = await pausedParser(source(bytes));
	reader.on('tickstart', () => ticks++);
	await expect(reader.seekTo(41)).rejects.toThrow('PBDEMS2');
	expect(ticks).toBe(0);
	reader.cancel();
	await parsing;
});

test('continuous parsing pauses after every effect and tickend; seek/resume uses the same promise and listeners', async () => {
	const reader = new DemoReader();
	const events: string[] = [];
	let pause!: Promise<void>;
	reader.on('tickstart', tick => {
		events.push(`start:${tick}`);
		if (tick === 0) pause = reader.pause();
	});
	reader.on('entitycreated', () => events.push('create'));
	reader.on('tickend', tick => events.push(`end:${tick}`));
	const paused = new Promise<void>(resolve => reader.once('paused', resolve));
	const parsing = reader.parseDemo(source(), { entities: EntityMode.ALL });
	let finished = false;
	void parsing.then(() => {
		finished = true;
	});
	await paused;
	await pause;
	expect(reader.isPaused).toBe(true);
	expect(finished).toBe(false);
	expect(events).toEqual(['start:0', 'create', 'end:0']);
	expect(await reader.seekTo(41)).toEqual({ status: 'complete', tick: 41 });
	expect(events).toEqual(['start:0', 'create', 'end:0']);
	reader.resume();
	expect(await parsing).toEqual({ status: 'complete' });
	expect(events.slice(3)).toEqual(['start:41', 'end:41', 'start:42', 'end:42']);
	expect(reader.isPaused).toBe(false);
});

test('seeking directly from a paused event is allowed and does not await the async listener', async () => {
	const reader = new DemoReader();
	let work!: Promise<void>;
	const ticks: number[] = [];
	reader.on('tickstart', tick => ticks.push(tick));
	reader.once('tickend', () => {
		void reader.pause();
	});
	reader.once('paused', () => {
		work = (async () => {
			await reader.seekTo(41);
			reader.resume();
		})();
	});
	await reader.parseDemo(source(), { entities: EntityMode.ALL });
	await work;
	expect(ticks).toEqual([0, 41, 42]);
});

test('forward, backward, repeated and sparse seeks remain silent, including once listeners', async () => {
	const { reader, parsing } = await pausedParser(source());
	const events: number[] = [];
	reader.on('tickend', tick => events.push(tick));
	for (const tick of [41, 11, 41]) {
		events.length = 0;
		let once = false;
		reader.once('tickstart', () => {
			once = true;
		});
		expect(await reader.seekTo(tick)).toEqual({ status: 'complete', tick });
		expect(events).toEqual([]);
		expect(once).toBe(false);
		expect(reader.players[1]?.name).toBe(tick === 41 ? 'Beta' : 'Alpha');
		expect(reader.entities[1]?.className).toBe('CCSPlayerPawn');
		expect(await oneTick(reader)).toBe(tick);
		expect(once).toBe(true);
	}
	expect(await reader.seekTo(2)).toEqual({ status: 'complete', tick: 10 });
	reader.cancel();
	expect(await parsing).toEqual({ status: 'cancelled' });
});

test('pause is idempotent, seeking while running rejects, and cancellation wakes a paused parse', async () => {
	const reader = new DemoReader();
	await expect(reader.pause()).rejects.toThrow('active');
	const parsing = reader.parseDemo(source());
	const first = reader.pause();
	expect(reader.pause()).toBe(first);
	await expect(reader.seekTo(41)).rejects.toThrow('pause');
	await first;
	await reader.pause();
	reader.cancel();
	expect(await parsing).toEqual({ status: 'cancelled' });
	await expect(reader.seekTo(0)).rejects.toThrow('pause');
	expect(() => reader.resume()).toThrow('not paused');
});

test('unusable FullPackets fall back without emitting replay and still contribute tables', async () => {
	for (const options of [{ dependentFullSnapshot: true }, { firstFullPacketDelta: true }, { brokenDelta: true }]) {
		const { reader, parsing } = await pausedParser(source(checkpointDemo(options)));
		const tick = options.dependentFullSnapshot ? 20 : options.firstFullPacketDelta ? 11 : 41;
		expect((await reader.seekTo(tick)).status).toBe('complete');
		await oneTick(reader);
		if (tick === 20) expect(reader.entities[1]).toBeUndefined();
		if (tick === 11) expect(reader.players[1]?.name).toBe('Alpha');
		reader.cancel();
		await parsing;
	}
});

test('cancelled/failed seeks remain paused; resume requires a successful reconstruction', async () => {
	const src = source();
	let block = false,
		entered!: () => void;
	const started = new Promise<void>(resolve => {
		entered = resolve;
	});
	const { reader, parsing } = await pausedParser({
		...src,
		async read(offset, length, signal) {
			if (block) {
				entered();
				await new Promise<void>((_resolve, reject) =>
					signal!.addEventListener('abort', () => reject(signal!.reason), { once: true })
				);
			}
			return src.read(offset, length, signal);
		}
	});
	block = true;
	const abort = new AbortController();
	const seeking = reader.seekTo(41, { signal: abort.signal });
	await started;
	expect(() => reader.resume()).toThrow('Await seekTo');
	await expect(reader.seekTo(11)).rejects.toThrow('already active');
	abort.abort();
	expect(await seeking).toEqual({ status: 'cancelled' });
	expect(reader.isPaused).toBe(true);
	expect(() => reader.resume()).toThrow('did not complete');
	block = false;
	await reader.seekTo(41);
	reader.resume();
	expect(await parsing).toEqual({ status: 'complete' });
});

test('invalid targets, truncation and budgets fail explicitly', async () => {
	const { reader, parsing } = await pausedParser(source());
	await expect(reader.seekTo(-1)).rejects.toThrow('nonnegative');
	expect(await reader.seekTo(100)).toEqual({ status: 'incomplete' });
	reader.cancel();
	await parsing;
	const truncated = await pausedParser(source(checkpointDemo().subarray(0, -4)));
	expect(await truncated.reader.seekTo(100)).toEqual({ status: 'incomplete' });
	truncated.reader.cancel();
	await truncated.parsing;
	for (const options of [{ maxFullPackets: 1 }, { maxSeekBytes: 500 }]) {
		const item = await pausedParser(source(), options);
		await expect(item.reader.seekTo(41)).rejects.toThrow();
		item.reader.cancel();
		await item.parsing;
	}
});

test('paused listener failures reject both pause and parse without leaving either pending', async () => {
	const reader = new DemoReader();
	const error = new Error('observer');
	reader.on('paused', () => {
		throw error;
	});
	const parsing = reader.parseDemo(source());
	const paused = reader.pause();
	expect(await Promise.allSettled([paused, parsing])).toEqual([
		{ status: 'rejected', reason: error },
		{ status: 'rejected', reason: error }
	]);
});

test('pause requested during tickend waits for the remaining tickend listeners', async () => {
	const reader = new DemoReader();
	const events: string[] = [];
	reader.once('tickend', () => {
		events.push('first');
		void reader.pause();
	});
	reader.once('tickend', () => events.push('last'));
	reader.once('paused', () => {
		events.push('paused');
		reader.resume();
	});
	await reader.parseDemo(source());
	expect(events).toEqual(['first', 'last', 'paused']);
});

test('large irrelevant payloads are skipped rather than fully fetched during seeking', async () => {
	const { reader, parsing } = await pausedParser(source(checkpointDemo({ paddingBytes: 4 * 1024 * 1024 })));
	expect(await reader.seekTo(41)).toEqual({ status: 'complete', tick: 41 });
	expect(reader.seekBytesRead).toBeLessThan(128 * 1024);
	reader.cancel();
	await parsing;
});

test('continuous seekable parsing reports consumed-byte progress before completion', async () => {
	const bytes = source();
	const reader = new DemoReader();
	const progress: number[] = [];
	reader.on('progress', offset => progress.push(offset));
	await reader.parseDemo({
		...bytes,
		async read(offset, length, signal) {
			// A slow read crosses the parser's periodic progress interval.
			await new Promise(resolve => setTimeout(resolve, 25));
			return bytes.read(offset, length, signal);
		}
	});
	expect(progress.length).toBeGreaterThan(1);
	expect(progress[0]).toBeGreaterThan(0);
	expect(progress[0]).toBeLessThan(bytes.size);
	expect(progress.at(-1)).toBe(bytes.size);
});

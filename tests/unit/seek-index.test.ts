import { expect, test } from 'bun:test';
import { DemoReader, EntityMode } from '../../src/index.js';
import { checkpointDemo } from '../helpers/checkpointDemo.js';
import { demoFrame } from '../helpers/demo.js';
import { oneTick, pausedParser } from '../helpers/pausedParser.js';

const collect = async (bytes: Uint8Array) => {
	const reader = new DemoReader();
	await reader.parseDemo(bytes);
	return reader.getSeekIndex();
};

test('stream parsing exports the same raw offsets across split headers and payloads', async () => {
	const bytes = checkpointDemo();
	const expected = await collect(bytes);
	expect(Object.keys(expected)).toEqual(['10', '15', '40']);
	for (const chunkSize of [1, 17, 1024]) {
		let offset = 0;
		const reader = new DemoReader();
		await reader.parseDemo(
			new ReadableStream<Uint8Array>({
				pull(controller) {
					if (offset >= bytes.length) return controller.close();
					controller.enqueue(bytes.subarray(offset, offset + chunkSize));
					offset += chunkSize;
				}
			})
		);
		expect(reader.getSeekIndex()).toEqual(expected);
		for (const [tick, position] of Object.entries(expected)) {
			expect(bytes[position]).toBe(13);
			expect(bytes[position + 1]).toBe(Number(tick));
		}
	}
});

test('importing before parsing or while paused skips packet discovery and preserves replay state', async () => {
	const original = checkpointDemo();
	const originalIndex = await collect(original);
	const insertion = originalIndex[15]!;
	const padding = Buffer.concat(Array.from({ length: 1024 }, () => demoFrame(10, new Uint8Array(1024), 12)));
	const bytes = Buffer.concat([original.subarray(0, insertion), padding, original.subarray(insertion)]);
	const index = await collect(bytes);
	for (const beforeParsing of [true, false]) {
		const reader = new DemoReader();
		const supplied = JSON.parse(JSON.stringify(index));
		if (beforeParsing) reader.setSeekIndex(supplied);
		const parsing = reader.parseDemo(
			{
				size: bytes.length,
				async read(offset, length) {
					// Reading headers through this interval would rebuild the index.
					if (offset > insertion + 65536 && offset < index[15]!)
						throw new Error('Read an ordinary packet in the skipped interval');
					return bytes.subarray(offset, offset + length);
				}
			},
			{ entities: EntityMode.ALL }
		);
		await reader.pause();
		if (!beforeParsing) reader.setSeekIndex(supplied);
		supplied[40] = 16;
		const exported = reader.getSeekIndex();
		delete exported[15];
		expect(reader.getSeekIndex()).toEqual(index);
		for (const target of [41, 11, 41, 0]) {
			expect(await reader.seekTo(target)).toEqual({ status: 'complete', tick: target });
			await oneTick(reader);
			if (target > 0) expect(reader.players[1]?.name).toBe(target === 11 ? 'Alpha' : 'Beta');
			expect(reader.entities[1]?.className).toBe('CCSPlayerPawn');
		}
		expect(await reader.seekTo(100)).toEqual({ status: 'incomplete' });
		reader.cancel();
		await parsing;
	}
});

test('replacement is atomic, validates offsets and limits, and an empty index restores discovery', async () => {
	const bytes = checkpointDemo();
	const index = await collect(bytes);
	const { reader, parsing } = await pausedParser(bytes);
	reader.setSeekIndex(index);
	const invalidIndexes: Record<string, number>[] = [
		{ '-2': 16 },
		{ '1.5': 16 },
		{ '01': 16 },
		{ NaN: 16 },
		{ 1: 15 },
		{ 1: 16.5 },
		{ 1: Infinity },
		{ 1: bytes.length },
		{ 1: 100, 2: 99 },
		{ 1: 100, 2: 100 }
	];
	for (const invalid of invalidIndexes) {
		expect(() => reader.setSeekIndex(invalid)).toThrow();
		expect(reader.getSeekIndex()).toEqual(index);
	}
	const seeking = reader.seekTo(41);
	expect(() => reader.setSeekIndex(index)).toThrow('before parsing or await pause');
	await seeking;
	reader.setSeekIndex({});
	expect(reader.getSeekIndex()).toEqual({});
	expect(await reader.seekTo(41)).toEqual({ status: 'complete', tick: 41 });
	expect(reader.getSeekIndex()).toEqual(index);
	reader.cancel();
	await parsing;
	expect(() => reader.setSeekIndex(index)).toThrow();

	for (const options of [{ maxFullPackets: 1 }, { maxSeekBytes: 100 }]) {
		const limited = await pausedParser(bytes, options);
		expect(() => limited.reader.setSeekIndex(index)).toThrow();
		expect(limited.reader.getSeekIndex()).toEqual({});
		limited.reader.cancel();
		await limited.parsing;
	}
});

test('seeking beyond an imported prefix collects later checkpoints', async () => {
	const bytes = checkpointDemo();
	const index = await collect(bytes);
	const { reader, parsing } = await pausedParser(bytes);
	reader.setSeekIndex({ 10: index[10]! });
	expect(await reader.seekTo(41)).toEqual({ status: 'complete', tick: 41 });
	expect(reader.getSeekIndex()).toEqual(index);
	await oneTick(reader);
	expect(reader.players[1]?.name).toBe('Beta');
	reader.cancel();
	await parsing;
});

test('setting an index while running is rejected and preloaded offsets are checked against the source', async () => {
	const bytes = checkpointDemo();
	const reader = new DemoReader();
	const parsing = reader.parseDemo(bytes);
	expect(() => reader.setSeekIndex({ 10: 16 })).toThrow();
	await parsing;
	const invalid = new DemoReader();
	invalid.setSeekIndex({ 10: bytes.length });
	await expect(invalid.parseDemo(bytes)).rejects.toThrow('outside the demo');
});

test('terminal cleanup preserves the exported index during end notifications and afterwards', async () => {
	const bytes = checkpointDemo();
	const index = await collect(bytes);
	for (const cancelled of [false, true]) {
		const { reader, parsing } = await pausedParser(bytes);
		reader.setSeekIndex(index);
		await reader.seekTo(41);
		let atEnd: Record<number, number> | undefined;
		reader.once('end', () => {
			atEnd = reader.getSeekIndex();
		});
		if (cancelled) reader.cancel();
		else reader.resume();
		await parsing;
		expect(atEnd).toEqual(index);
		expect(reader.getSeekIndex()).toEqual(index);
		delete atEnd![40];
		expect(reader.getSeekIndex()).toEqual(index);
	}
});

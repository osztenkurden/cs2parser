import { describe, expect, test } from 'bun:test';
import { Readable } from 'stream';
import snappy from 'snappy';
import { DemoReader } from '../../src/index.js';
import { DemoReader as BrowserReader } from '../../src/browser.js';
import { EDemoCommands } from '../../src/ts-proto/demo.js';
import { bytesField, demoFile, demoFrame, varint } from '../helpers/demo.js';

const stop = demoFrame(EDemoCommands.DEM_Stop);
const info = demoFrame(EDemoCommands.DEM_FileInfo, Uint8Array.from([16, ...varint(124341), 24, 5]));
const streamOf = (chunks: Uint8Array[]) =>
	new ReadableStream<Uint8Array>({
		pull(controller) {
			const chunk = chunks.shift();
			if (chunk) controller.enqueue(chunk);
			else controller.close();
		}
	});

describe('demo frame events', () => {
	test('retained bytes survive stream carry-buffer refills', async () => {
		const reader = new DemoReader();
		let retained: Uint8Array | undefined;
		reader.on('DEM_CustomData', data => {
			retained = data.data;
			expect(Array.from(retained!)).toEqual([1, 2, 3]);
		});
		const chunks = [
			demoFile(),
			demoFrame(EDemoCommands.DEM_CustomData, bytesField(2, Uint8Array.of(1, 2, 3))),
			demoFrame(EDemoCommands.DEM_ConsoleCmd, bytesField(1, new Uint8Array(100).fill(65))),
			Buffer.concat([stop, info])
		];
		await reader.parseDemo(Readable.from(chunks));
		expect(Array.from(retained!)).toEqual([1, 2, 3]);
	});

	test.each([false, true])('trailers survive every stream split (compressed: %s)', async compressed => {
		const body = Uint8Array.from([16, ...varint(124341), 24, 5]);
		const trailer = compressed
			? demoFrame(EDemoCommands.DEM_FileInfo | EDemoCommands.DEM_IsCompressed, snappy.compressSync(body))
			: info;
		for (let split = 0; split <= trailer.length; split++) {
			const reader = new DemoReader();
			const events: string[] = [];
			reader.on('DEM_FileInfo', data => {
				expect(data.playback_ticks).toBe(124341);
				events.push('info');
			});
			reader.on('end', end => {
				expect(end).toEqual({ status: 'complete' });
				events.push('end');
			});
			const result = await reader.parseDemo(
				Readable.from([demoFile(stop, trailer.subarray(0, split)), trailer.subarray(split)])
			);
			expect(result).toEqual({ status: 'complete' });
			expect(events).toEqual(['info', 'end']);
		}
	});

	test('a trailer subscription completes at EOF even with an absent or truncated trailer', async () => {
		for (const trailer of [new Uint8Array(0), info.subarray(0, 1), info.subarray(0, info.length - 1)]) {
			const reader = new DemoReader();
			let infos = 0;
			const ends: unknown[] = [];
			reader.on('DEM_FileInfo', () => infos++);
			reader.on('end', end => ends.push(end));
			const result = await reader.parseDemo(Readable.from([demoFile(stop), trailer]));
			expect(result).toEqual({ status: 'complete' });
			expect(infos).toBe(0);
			expect(ends).toEqual([{ status: 'complete' }]);
		}
	});

	test.each(['buffer', 'browser Web stream'])('%s emits the trailer before end', async source => {
		const reader = source === 'buffer' ? new DemoReader() : new BrowserReader();
		const events: string[] = [];
		reader.on('DEM_FileInfo', data => {
			expect(data.playback_ticks).toBe(124341);
			events.push('info');
		});
		reader.on('end', () => events.push('end'));
		expect(
			await reader.parseDemo(source === 'buffer' ? demoFile(stop, info) : streamOf([demoFile(stop), info]))
		).toEqual({ status: 'complete' });
		expect(events).toEqual(['info', 'end']);
	});

	test('every truncated trailer reports the same consumed bytes for buffers and streams', async () => {
		for (let size = 0; size <= info.length; size++) {
			const bytes = demoFile(stop, info.subarray(0, size));
			const totals: number[] = [];
			for (const source of [bytes, Readable.from([bytes])]) {
				const reader = new DemoReader();
				reader.on('DEM_FileInfo', () => {});
				let progress = 0;
				reader.on('progress', value => (progress = value));
				expect(await reader.parseDemo(source)).toEqual({ status: 'complete' });
				totals.push(progress);
			}
			expect(totals).toEqual([16 + stop.length + (size === info.length ? size : 0), totals[0]!]);
		}
	});

	test('without a trailer subscription DEM_Stop finishes before stream EOF', async () => {
		const source = new Readable({ read() {} });
		const reader = new DemoReader();
		const parsed = reader.parseDemo(source);
		source.push(demoFile(stop));
		await parsed;
		expect(reader.hasEnded).toBe(true);
		source.destroy();
	});

	test('browser parsing handles every prefix/frame split, empty chunks, and compressed data', async () => {
		const header = demoFrame(
			EDemoCommands.DEM_FileHeader | EDemoCommands.DEM_IsCompressed,
			snappy.compressSync(bytesField(5, new TextEncoder().encode('de_dust2')))
		);
		const data = demoFile(header, stop);
		for (let split = 0; split <= data.length; split++) {
			const reader = new BrowserReader();
			const source = streamOf([data.subarray(0, split), new Uint8Array(), data.subarray(split)]);
			expect(await reader.parseDemo(source)).toEqual({ status: 'complete' });
			expect(reader.header?.map_name).toBe('de_dust2');
			expect(source.locked).toBe(false);
		}
	});

	test('progress is cumulative bytes across carry compaction and stops at consumed input', async () => {
		const reader = new BrowserReader();
		const frame = demoFrame(EDemoCommands.DEM_SyncTick);
		const data = demoFile(...Array.from({ length: 10001 }, () => frame), stop);
		const chunks = Array.from({ length: Math.ceil(data.length / 31) }, (_, i) =>
			data.subarray(i * 31, (i + 1) * 31)
		);
		const progress: number[] = [];
		reader.on('progress', value => progress.push(value));
		await reader.parseDemo(streamOf(chunks));
		expect(progress.length).toBeGreaterThan(1);
		expect(progress.at(-1)).toBe(data.length);
		expect(progress).toEqual([...progress].sort((a, b) => a - b));
	});

	test('compressed event bytes survive reuse of the WASM frame buffer', async () => {
		const reader = new BrowserReader();
		let retained: Uint8Array | undefined;
		reader.on('DEM_CustomData', value => (retained = value.data));
		reader.on('DEM_ConsoleCmd', () => {});
		const custom = demoFrame(
			EDemoCommands.DEM_CustomData | EDemoCommands.DEM_IsCompressed,
			snappy.compressSync(bytesField(2, Uint8Array.of(1, 2, 3)))
		);
		const other = demoFrame(
			EDemoCommands.DEM_ConsoleCmd | EDemoCommands.DEM_IsCompressed,
			snappy.compressSync(bytesField(1, new Uint8Array(3).fill(65)))
		);
		await reader.parseDemo(streamOf([demoFile(custom), other, stop]));
		expect(retained).toEqual(Uint8Array.of(1, 2, 3));
	});
});

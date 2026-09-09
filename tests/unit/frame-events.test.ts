import { describe, expect, test } from 'bun:test';
import { Readable } from 'stream';
import snappy from 'snappy';
import { DemoReader } from '../../src/index.js';
import { EDemoCommands } from '../../src/ts-proto/demo.js';
import { bytesField, demoFile, demoFrame, varint } from '../helpers/demo.js';

const stop = demoFrame(EDemoCommands.DEM_Stop);
const info = demoFrame(EDemoCommands.DEM_FileInfo, Uint8Array.from([16, ...varint(124341), 24, 5]));

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
				expect(end).toEqual({ incomplete: false });
				events.push('end');
			});
			const result = await reader.parseDemo(
				Readable.from([demoFile(stop, trailer.subarray(0, split)), trailer.subarray(split)])
			);
			expect(result).toEqual({ incomplete: false });
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
			expect(result).toEqual({ incomplete: false });
			expect(infos).toBe(0);
			expect(ends).toEqual([{ incomplete: false }]);
		}
	});

	test('buffer parsing emits the trailer before end', async () => {
		const reader = new DemoReader();
		const events: string[] = [];
		reader.on('DEM_FileInfo', () => events.push('info'));
		reader.on('end', () => events.push('end'));
		await reader.parseDemo(demoFile(stop, info));
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
				expect(await reader.parseDemo(source)).toEqual({ incomplete: false });
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
});

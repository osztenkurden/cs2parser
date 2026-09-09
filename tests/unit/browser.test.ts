import { expect, test } from 'bun:test';
import snappy from 'snappy';
import { BinaryWriter } from '@bufbuild/protobuf/wire';
import { DemoReader } from '../../src/browser.js';
import { EDemoCommands } from '../../src/ts-proto/demo.js';
import { demoFile, demoFrame, bytesField, varint, networkPacket } from '../helpers/demo.js';
import { SVC_Messages } from '../../src/ts-proto/netmessages.js';
import { buildFragment } from './broadcast/helpers.js';

const stop = demoFrame(EDemoCommands.DEM_Stop);
const streamOf = (chunks: Uint8Array[]) =>
	new ReadableStream<Uint8Array>({
		pull(controller) {
			const chunk = chunks.shift();
			if (chunk) controller.enqueue(chunk);
			else controller.close();
		}
	});

test('nested compressed string tables and entries leave the outer packet intact', async () => {
	const value = Uint8Array.of(1, 2, 3, 4);
	const compressed = snappy.compressSync(value);
	const bits: number[] = [];
	const write = (value: number, count: number) => {
		for (let i = 0; i < count; i++) bits.push((value >>> i) & 1);
	};
	write(1, 1);
	write(1, 1);
	write(0, 1); // consecutive entry, key, no history
	write(55, 8);
	write(0, 8); // key "7"
	write(1, 1);
	write(1, 1); // value present and compressed
	write(compressed.length, 17);
	for (const byte of compressed) write(byte, 8);
	const tableBytes = new Uint8Array(Math.ceil(bits.length / 8));
	bits.forEach((bit, i) => (tableBytes[i >>> 3]! |= bit << (i & 7)));
	const table = new BinaryWriter()
		.uint32(10)
		.string('instancebaseline')
		.uint32(16)
		.int32(1)
		.uint32(48)
		.int32(1)
		.uint32(58)
		.bytes(snappy.compressSync(tableBytes))
		.uint32(72)
		.bool(true)
		.finish();
	const packet = bytesField(
		3,
		networkPacket([
			{ id: SVC_Messages.svc_CreateStringTable, body: table },
			{ id: SVC_Messages.svc_ServerInfo, body: bytesField(15, new TextEncoder().encode('de_nuke')) }
		])
	);
	const frame = demoFrame(EDemoCommands.DEM_Packet | EDemoCommands.DEM_IsCompressed, snappy.compressSync(packet));
	const reader = new DemoReader();
	let retained: Uint8Array | undefined;
	let map: string | undefined;
	reader.on('createstringtable', table => (retained = table?.table.data[0]?.value ?? undefined));
	reader.on('serverinfo', info => (map = info.map_name));
	expect(await reader.parseDemo(demoFile(frame, frame, stop))).toEqual({ incomplete: false });
	expect(map).toBe('de_nuke');
	expect(retained).toEqual(value);
});

test('browser parsing handles every prefix/frame split, empty chunks, and compressed data', async () => {
	const header = demoFrame(
		EDemoCommands.DEM_FileHeader | EDemoCommands.DEM_IsCompressed,
		snappy.compressSync(bytesField(5, new TextEncoder().encode('de_dust2')))
	);
	const data = demoFile(header, stop);
	for (let split = 0; split <= data.length; split++) {
		const reader = new DemoReader();
		const source = streamOf([data.subarray(0, split), new Uint8Array(), data.subarray(split)]);
		expect(await reader.parseDemo(source)).toEqual({ incomplete: false });
		expect(reader.header?.map_name).toBe('de_dust2');
		expect(source.locked).toBe(false);
	}
});

test('cancellation unblocks a pending read and cancels the source exactly once', async () => {
	let cancelled = 0;
	const source = new ReadableStream<Uint8Array>({
		cancel() {
			cancelled++;
		}
	});
	const reader = new DemoReader();
	const ends: unknown[] = [];
	reader.on('end', result => ends.push(result));
	const parsed = reader.parseDemo(source);
	reader.cancel();
	const result = await parsed;
	expect(result).toEqual({ incomplete: true, reason: 'cancelled' });
	expect(ends).toEqual([result]);
	expect(cancelled).toBe(1);
	expect(source.locked).toBe(false);
});

test('early stop cancels unread input, but trailer subscribers wait for EOF', async () => {
	let controller!: ReadableStreamDefaultController<Uint8Array>;
	let cancelled = false;
	const source = new ReadableStream<Uint8Array>({
		start(c) {
			controller = c;
		},
		cancel() {
			cancelled = true;
		}
	});
	const parsed = new DemoReader().parseDemo(source);
	controller.enqueue(demoFile(stop));
	await parsed;
	expect(cancelled).toBe(true);
	expect(source.locked).toBe(false);

	const trailer = demoFrame(EDemoCommands.DEM_FileInfo, Uint8Array.of(16, 42));
	const reader = new DemoReader();
	let ticks: number | undefined;
	reader.on('DEM_FileInfo', info => (ticks = info.playback_ticks));
	expect(await reader.parseDemo(streamOf([demoFile(stop), trailer]))).toEqual({ incomplete: false });
	expect(ticks).toBe(42);
});

test('progress is cumulative bytes across carry compaction and stops at consumed input', async () => {
	const reader = new DemoReader();
	const frame = demoFrame(EDemoCommands.DEM_SyncTick);
	const frames = Array.from({ length: 10001 }, () => frame);
	const data = demoFile(...frames, stop);
	const chunks = Array.from({ length: Math.ceil(data.length / 31) }, (_, i) => data.subarray(i * 31, (i + 1) * 31));
	const progress: number[] = [];
	reader.on('progress', value => progress.push(value));
	await reader.parseDemo(streamOf(chunks));
	expect(progress.length).toBeGreaterThan(1);
	expect(progress.at(-1)).toBe(data.length);
	expect(progress).toEqual([...progress].sort((a, b) => a - b));
});

test('compressed event bytes survive reuse of the WASM frame buffer', async () => {
	const reader = new DemoReader();
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

test('metadata handles Blob slices, compressed headers, offsets, and missing trailers', async () => {
	const header = demoFrame(
		EDemoCommands.DEM_FileHeader | EDemoCommands.DEM_IsCompressed,
		snappy.compressSync(bytesField(5, new TextEncoder().encode('de_nuke')))
	);
	const trailer = demoFrame(EDemoCommands.DEM_FileInfo, Uint8Array.from([16, ...varint(400)]));
	const data = demoFile(header, stop, trailer);
	data.writeUInt32LE(16 + header.length + stop.length, 8);
	const padded = new Uint8Array(data.length + 10);
	padded.set(data, 5);
	for (const source of [padded.subarray(5, 5 + data.length), new Blob([Uint8Array.from(data)])]) {
		expect((await DemoReader.parseHeader(source))?.map_name).toBe('de_nuke');
		expect((await DemoReader.parseFileInfo(source))?.playback_ticks).toBe(400);
	}
	expect(await DemoReader.parseFileInfo(new Blob([Uint8Array.from(demoFile(header, stop))]))).toBeNull();
	expect(await DemoReader.parseHeader(new Uint8Array(10))).toBeNull();
});

test('source failures and invalid chunks return the original terminal error and release the lock', async () => {
	for (const afterPrefix of [false, true]) {
		const error = new Error('source failure');
		let first = true;
		const source = new ReadableStream<Uint8Array>({
			pull(c) {
				if (afterPrefix && first) {
					first = false;
					c.enqueue(demoFile());
				} else c.error(error);
			}
		});
		expect(await new DemoReader().parseDemo(source)).toEqual({ incomplete: true, error });
		expect(source.locked).toBe(false);
	}
	const source = new ReadableStream({
		start(c) {
			c.enqueue('invalid');
		}
	});
	const result = await new DemoReader().parseDemo(source);
	expect(result.error).toBeInstanceOf(TypeError);
	expect(source.locked).toBe(false);
});

test('emitter preserves meta-events, prepend ordering, once removal, and duplicate listeners', () => {
	const reader = new DemoReader();
	const calls: string[] = [];
	const removed: string[] = [];
	reader.on('removeListener', name => removed.push(String(name)));
	const listener = () => calls.push('regular');
	reader.addListener('debug', listener).addListener('debug', listener);
	reader.removeListener('debug', listener);
	expect(reader.listenerCount('debug')).toBe(1);
	const epoch = reader._listenerEpoch;
	reader.prependOnceListener('debug', () => calls.push('first'));
	reader.emit('debug', 'test');
	expect(calls).toEqual(['first', 'regular']);
	expect(reader._listenerEpoch).toBeGreaterThan(epoch + 1);
	expect(removed.filter(name => name === 'debug')).toHaveLength(2);
	reader.off('debug', listener);
	expect(reader.listenerCount('debug')).toBe(0);
	expect(reader.setMaxListeners(20).getMaxListeners()).toBe(20);
});

test('starting another demo or broadcast does not interrupt an active parse', async () => {
	const reader = new DemoReader();
	const pending = reader.parseDemo(new ReadableStream<Uint8Array>());
	expect(() => reader.parseDemo(demoFile(stop))).toThrow('already in progress');
	await expect(reader.parseHttpBroadcast('https://unused.invalid/')).rejects.toThrow('already in progress');
	expect(reader.hasEnded).toBe(false);
	reader.cancel();
	expect((await pending).reason).toBe('cancelled');
});

test.each(['complete', 'error', 'cancel'])('decoder storage is released after %s', async outcome => {
	const reader = new DemoReader();
	const release = reader._snappy.release!.bind(reader._snappy);
	let releases = 0;
	reader._snappy.release = () => {
		releases++;
		release();
	};
	const header = demoFrame(
		EDemoCommands.DEM_FileHeader | EDemoCommands.DEM_IsCompressed,
		snappy.compressSync(bytesField(5, new TextEncoder().encode('de_nuke')))
	);
	if (outcome === 'cancel') reader.on('header', () => reader.cancel());
	const result = await reader.parseDemo(
		demoFile(header, outcome === 'error' ? demoFrame(EDemoCommands.DEM_FileHeader, Uint8Array.of(10, 255)) : stop)
	);
	expect(releases).toBe(1);
	if (outcome === 'complete') expect(result).toEqual({ incomplete: false });
	if (outcome === 'error') expect(result.error).toBeInstanceOf(Error);
	if (outcome === 'cancel') expect(result.reason).toBe('cancelled');
});

test('broadcast cancellation stops later commands from recreating decoder storage', async () => {
	const reader = new DemoReader();
	let decodes = 0;
	let released = false;
	const decode = reader._snappy.uncompressFrame.bind(reader._snappy);
	const release = reader._snappy.release!.bind(reader._snappy);
	reader._snappy.uncompressFrame = bytes => {
		expect(released).toBe(false);
		decodes++;
		return decode(bytes);
	};
	reader._snappy.release = () => {
		released = true;
		release();
	};
	reader.on('tickstart', tick => {
		if (tick === 100) reader.cancel();
	});
	let reason: string | undefined;
	reader.on('end', end => (reason = end.reason));
	const compressed = snappy.compressSync(new Uint8Array(0));
	const fragment = buildFragment(
		[100, 101].map(tick => ({
			cmd: EDemoCommands.DEM_Packet,
			tick,
			payload: compressed,
			isCompressed: true
		}))
	);
	await reader.parseHttpBroadcast('https://unused.invalid/', {
		fetcher: {
			async json<T>() {
				return { tick: 100, rtdelay: 0, rcvage: 0, fragment: 5, signup_fragment: 0, tps: 64, protocol: 5 } as T;
			},
			async bytes(path) {
				return { ok: true, data: path === '0/start' ? new Uint8Array(0) : fragment };
			}
		}
	});
	expect(decodes).toBe(1);
	expect(released).toBe(true);
	expect(reason).toBe('cancelled');
	expect(reader.currentTick).toBe(100);
});

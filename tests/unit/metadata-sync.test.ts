import { afterAll, beforeAll, expect, spyOn, test } from 'bun:test';
import fs from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import snappy from 'snappy';
import { DemoReader } from '../../src/index.js';
import { DemoReader as BrowserReader } from '../../src/browser.js';
import { SnappyDecoder } from '../../src/compression/wasm.js';
import { EDemoCommands, type CDemoFileHeader, type CDemoFileInfo } from '../../src/ts-proto/demo.js';
import { SVC_Messages, type CSVCMsg_ServerInfo } from '../../src/ts-proto/netmessages.js';
import { bytesField, demoFile, demoFrame, networkPacket } from '../helpers/demo.js';

const methods = [
	['parseHeaderSync', 'parseHeader'],
	['parseServerInfoSync', 'parseServerInfo'],
	['parseFileInfoSync', 'parseFileInfo']
] as const;
const headerName = 'x'.repeat(8192);
const packet = bytesField(
	3,
	networkPacket([
		{ id: 999, body: Uint8Array.of(1, 2, 3) },
		{
			id: SVC_Messages.svc_ServerInfo,
			body: Buffer.concat([
				bytesField(15, new TextEncoder().encode('de_nuke')),
				bytesField(20, Uint8Array.of(1, 2, 3))
			])
		}
	])
);
const fixtures = [false, true].map(compressed => {
	const frame = (type: EDemoCommands, body: Uint8Array) =>
		demoFrame(
			type | (compressed ? EDemoCommands.DEM_IsCompressed : 0),
			compressed ? snappy.compressSync(body) : body,
			0xffffffff
		);
	const header = frame(EDemoCommands.DEM_FileHeader, bytesField(5, new TextEncoder().encode(headerName)));
	const skipped = demoFrame(EDemoCommands.DEM_CustomData, new Uint8Array(1024 * 1024), 0xffffffff);
	const emptyPacket = frame(
		EDemoCommands.DEM_SignonPacket,
		bytesField(3, networkPacket([{ id: 999, body: Uint8Array.of(1) }]))
	);
	const signon = frame(EDemoCommands.DEM_SignonPacket, packet);
	const trailer = frame(EDemoCommands.DEM_FileInfo, Uint8Array.of(16, 42));
	const bytes = demoFile(header, skipped, emptyPacket, signon, demoFrame(EDemoCommands.DEM_Stop), trailer);
	bytes.writeUInt32LE(bytes.length - trailer.length, 8);
	return {
		compressed,
		bytes,
		header,
		signon,
		trailer,
		skippedStart: 16 + header.length,
		skippedEnd: 16 + header.length + skipped.length
	};
});
let directory: string;
beforeAll(() => {
	directory = fs.mkdtempSync(join(tmpdir(), 'cs2parser-metadata-sync-'));
	for (const fixture of fixtures) fs.writeFileSync(join(directory, `${fixture.compressed}.dem`), fixture.bytes);
});
afterAll(() => fs.rmSync(directory, { recursive: true, force: true }));

for (const fixture of fixtures) {
	test(`synchronous results match async metadata across paths and byte views (compressed=${fixture.compressed})`, async () => {
		const backing = new Uint8Array(fixture.bytes.length + 11);
		backing.set(fixture.bytes, 5);
		const sources = [
			join(directory, `${fixture.compressed}.dem`),
			fixture.bytes,
			backing.subarray(5, 5 + fixture.bytes.length)
		];
		for (const source of sources) {
			const header: CDemoFileHeader | null = DemoReader.parseHeaderSync(source);
			const serverInfo: CSVCMsg_ServerInfo | null = DemoReader.parseServerInfoSync(source);
			const fileInfo: CDemoFileInfo | null = DemoReader.parseFileInfoSync(source);
			expect(header?.map_name).toBe(headerName);
			expect(serverInfo?.map_name).toBe('de_nuke');
			expect(fileInfo?.playback_ticks).toBe(42);
			for (const [result, async] of [
				[header, 'parseHeader'],
				[serverInfo, 'parseServerInfo'],
				[fileInfo, 'parseFileInfo']
			] as const) {
				expect(result).not.toBeInstanceOf(Promise);
				const pending = DemoReader[async](source);
				expect(pending).toBeInstanceOf(Promise);
				expect(result).toEqual(await pending);
			}
			// Retained protobuf bytes survive decoder release and subsequent metadata calls.
			expect(serverInfo?.game_session_manifest).toEqual(Uint8Array.of(1, 2, 3));
		}
	});
}

for (const [sync] of methods) {
	test(`${sync} rejects unsupported inputs and missing paths synchronously`, () => {
		for (const source of [new Blob(), new ArrayBuffer(16), null, undefined, 1, {}]) {
			expect(() => DemoReader[sync](source as unknown as Uint8Array)).toThrow(TypeError);
		}
		expect(() => DemoReader[sync](join(directory, 'missing.dem'))).toThrow();
		expect(sync in BrowserReader).toBe(false);
	});

	test(`${sync} returns null for absent/truncated metadata`, () => {
		for (const bytes of [new Uint8Array(0), new Uint8Array(15), demoFile(demoFrame(EDemoCommands.DEM_Stop))]) {
			expect(DemoReader[sync](bytes)).toBeNull();
		}
		const fixture = fixtures[1]!;
		const truncated =
			sync === 'parseHeaderSync'
				? demoFile(fixture.header.subarray(0, -1))
				: sync === 'parseServerInfoSync'
					? demoFile(fixture.signon.subarray(0, -1))
					: fixture.bytes.subarray(0, -1);
		expect(DemoReader[sync](truncated)).toBeNull();
	});

	test(`${sync} closes files and releases the decoder`, () => {
		const open = spyOn(fs, 'openSync');
		const close = spyOn(fs, 'closeSync');
		const release = spyOn(SnappyDecoder.prototype, 'release');
		try {
			DemoReader[sync](join(directory, 'true.dem'));
			expect(open).toHaveBeenCalledTimes(1);
			expect(close).toHaveBeenCalledTimes(1);
			expect(close).toHaveBeenCalledWith(open.mock.results[0]!.value);
			expect(release).toHaveBeenCalledTimes(1);
		} finally {
			open.mockRestore();
			close.mockRestore();
			release.mockRestore();
		}
	});
}

test('metadata reads skip unrelated megabyte payloads and seek directly to the trailer', () => {
	const fixture = fixtures[0]!;
	const original = fs.readSync;
	const reads: { offset: number; length: number }[] = [];
	const spy = spyOn(fs, 'readSync').mockImplementation(((
		fd: number,
		bytes: Uint8Array,
		start: number,
		length: number,
		offset: number
	) => {
		reads.push({ offset, length });
		return original(fd, bytes, start, length, offset);
	}) as typeof fs.readSync);
	try {
		const path = join(directory, 'false.dem');
		expect(DemoReader.parseHeaderSync(path)?.map_name).toBe(headerName);
		expect(DemoReader.parseServerInfoSync(path)?.map_name).toBe('de_nuke');
		expect(
			reads.every(
				read => read.offset + read.length <= fixture.skippedStart + 15 || read.offset >= fixture.skippedEnd
			)
		).toBe(true);
		expect(reads.reduce((n, read) => n + read.length, 0)).toBeLessThan(16 * 1024);
		reads.length = 0;
		expect(DemoReader.parseFileInfoSync(path)?.playback_ticks).toBe(42);
		expect(reads[0]).toEqual({ offset: 0, length: 16 });
		expect(reads.slice(1).every(read => read.offset >= fixture.bytes.length - fixture.trailer.length)).toBe(true);
		expect(reads.reduce((n, read) => n + read.length, 0)).toBeLessThan(100);
	} finally {
		spy.mockRestore();
	}
});

test('positioned reads handle short reads and early EOF', () => {
	const original = fs.readSync;
	const short = spyOn(fs, 'readSync').mockImplementation(((
		fd: number,
		bytes: Uint8Array,
		start: number,
		length: number,
		offset: number
	) => original(fd, bytes, start, Math.min(3, length), offset)) as typeof fs.readSync);
	try {
		expect(DemoReader.parseHeaderSync(join(directory, 'true.dem'))?.map_name).toBe(headerName);
		expect(DemoReader.parseServerInfoSync(join(directory, 'true.dem'))?.map_name).toBe('de_nuke');
		expect(DemoReader.parseFileInfoSync(join(directory, 'true.dem'))?.playback_ticks).toBe(42);
	} finally {
		short.mockRestore();
	}
	let calls = 0;
	const eof = spyOn(fs, 'readSync').mockImplementation(((
		fd: number,
		bytes: Uint8Array,
		start: number,
		length: number,
		offset: number
	) => (++calls === 2 ? 0 : original(fd, bytes, start, length, offset))) as typeof fs.readSync);
	const close = spyOn(fs, 'closeSync');
	try {
		expect(DemoReader.parseHeaderSync(join(directory, 'true.dem'))).toBeNull();
		expect(close).toHaveBeenCalledTimes(1);
	} finally {
		eof.mockRestore();
		close.mockRestore();
	}
});

test.each(['fstatSync', 'readSync'] as const)('closes the descriptor when %s throws', operation => {
	const error = new Error('Injected I/O failure');
	const fail = spyOn(fs, operation).mockImplementation(() => {
		throw error;
	});
	const close = spyOn(fs, 'closeSync');
	try {
		expect(() => DemoReader.parseHeaderSync(join(directory, 'true.dem'))).toThrow(error);
		expect(close).toHaveBeenCalledTimes(1);
	} finally {
		fail.mockRestore();
		close.mockRestore();
	}
});

test('malformed frame headers, protobuf, and Snappy throw without leaking file descriptors', () => {
	const path = join(directory, 'malformed.dem');
	for (const bytes of [
		demoFile(Uint8Array.of(255, 255, 255, 255, 16)),
		demoFile(demoFrame(EDemoCommands.DEM_FileHeader, Uint8Array.of(10, 255))),
		demoFile(demoFrame(EDemoCommands.DEM_FileHeader | EDemoCommands.DEM_IsCompressed, Uint8Array.of(128)))
	]) {
		fs.writeFileSync(path, bytes);
		const close = spyOn(fs, 'closeSync');
		try {
			expect(() => DemoReader.parseHeaderSync(path)).toThrow();
			expect(close).toHaveBeenCalledTimes(1);
		} finally {
			close.mockRestore();
		}
	}
});

test('server-info search stops on truncation and at the end of signon', async () => {
	const truncated = networkPacket([{ id: SVC_Messages.svc_ServerInfo, body: new Uint8Array(20) }]).subarray(0, 3);
	for (const first of [
		demoFrame(EDemoCommands.DEM_SignonPacket, bytesField(3, truncated), 0xffffffff),
		demoFrame(EDemoCommands.DEM_Packet, bytesField(3, new Uint8Array(0)), 0)
	]) {
		const bytes = demoFile(first, demoFrame(EDemoCommands.DEM_SignonPacket, packet, 0xffffffff));
		expect(DemoReader.parseServerInfoSync(bytes)).toBeNull();
		expect(await DemoReader.parseServerInfo(bytes)).toBeNull();
	}
});

test('file-info seeks support unsigned offsets beyond 2 GiB without reading the file body', async () => {
	const path = join(directory, 'sparse.dem');
	const offset = 0x80000020;
	const prefix = demoFile();
	prefix.writeUInt32LE(offset, 8);
	const fd = fs.openSync(path, 'w');
	try {
		fs.writeSync(fd, prefix, 0, prefix.length, 0);
		fs.writeSync(fd, fixtures[1]!.trailer, 0, fixtures[1]!.trailer.length, offset);
	} finally {
		fs.closeSync(fd);
	}
	const result = DemoReader.parseFileInfoSync(path);
	expect(result?.playback_ticks).toBe(42);
	expect(result).toEqual(await DemoReader.parseFileInfo(path));
});

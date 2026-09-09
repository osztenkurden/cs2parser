import { expect, test } from 'bun:test';
import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import snappy from 'snappy';
import { DemoReader } from '../../src/browser.js';
import { DemoReader as ServerReader } from '../../src/index.js';
import { EDemoCommands } from '../../src/ts-proto/demo.js';
import { SVC_Messages } from '../../src/ts-proto/netmessages.js';
import { demoFile, demoFrame, bytesField, networkPacket } from '../helpers/demo.js';

class TrackedBlob extends Blob {
	reads: [number, number][] = [];
	override slice(start = 0, end = this.size, type?: string) {
		this.reads.push([start, end]);
		return super.slice(start, end, type);
	}
}

test('metadata reads large headers, scans signon, and seeks trailers without reading intervening payloads', async () => {
	const headerBytes = new TextEncoder().encode('x'.repeat(8192));
	const header = demoFrame(EDemoCommands.DEM_FileHeader, bytesField(5, headerBytes), 0xffffffff);
	const skipped = demoFrame(EDemoCommands.DEM_CustomData, new Uint8Array(1024 * 1024), 0xffffffff);
	const info = bytesField(15, new TextEncoder().encode('de_nuke'));
	const packet = bytesField(3, networkPacket([{ id: SVC_Messages.svc_ServerInfo, body: info }]));
	const signon = demoFrame(
		EDemoCommands.DEM_SignonPacket | EDemoCommands.DEM_IsCompressed,
		snappy.compressSync(packet),
		0xffffffff
	);
	const stop = demoFrame(EDemoCommands.DEM_Stop);
	const trailer = demoFrame(
		EDemoCommands.DEM_FileInfo | EDemoCommands.DEM_IsCompressed,
		snappy.compressSync(Uint8Array.of(16, 42))
	);
	const data = demoFile(header, skipped, signon, stop, trailer);
	const trailerOffset = data.length - trailer.length;
	data.writeUInt32LE(trailerOffset, 8);
	const source = new TrackedBlob([Uint8Array.from(data)]);

	expect((await DemoReader.parseHeader(source))?.map_name).toHaveLength(8192);
	expect((await DemoReader.parseServerInfo(source))?.map_name).toBe('de_nuke');
	// The unknown frame is skipped by size; only its header is read.
	const skippedBody = 16 + header.length + skipped.length - 1024 * 1024;
	expect(source.reads.every(([start, end]) => end <= skippedBody + 15 || start >= skippedBody + 1024 * 1024)).toBe(
		true
	);
	source.reads = [];
	expect((await DemoReader.parseFileInfo(source))?.playback_ticks).toBe(42);
	expect(source.reads[0]).toEqual([0, 16]);
	expect(source.reads.slice(1).every(([start]) => start >= trailerOffset)).toBe(true);
	expect(source.reads.reduce((sum, [start, end]) => sum + end - start, 0)).toBeLessThan(100);
});

test('metadata returns null for incomplete data and rejects invalid frame varints', async () => {
	const header = demoFrame(EDemoCommands.DEM_FileHeader, bytesField(5, new TextEncoder().encode('de_nuke')));
	expect(await DemoReader.parseHeader(demoFile(header).subarray(0, -1))).toBeNull();
	expect(await DemoReader.parseServerInfo(new Uint8Array(10))).toBeNull();
	const malformed = demoFile(Uint8Array.of(255, 255, 255, 255, 16));
	await expect(DemoReader.parseHeader(malformed)).rejects.toThrow('varint');
});

test('all server metadata helpers reject missing files in Node and Bun', async () => {
	const path = join(tmpdir(), `cs2parser-missing-${randomUUID()}.dem`);
	for (const read of [ServerReader.parseHeader, ServerReader.parseServerInfo, ServerReader.parseFileInfo]) {
		await expect(read(path)).rejects.toThrow();
	}
});

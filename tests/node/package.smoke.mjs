import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { DemoReader } from 'cs2parser';
import { DemoReader as BrowserReader, SnappyDecoder } from 'cs2parser/browser';

const directory = await mkdtemp(join(tmpdir(), 'cs2parser-package-'));
try {
	// Raw Snappy: nine output bytes, one nine-byte literal containing the protobuf header.
	const header = Buffer.from([9, 32, 42, 7, ...Buffer.from('de_nuke')]);
	// Literal-compressed CDemoPacket containing a bit-packed svc_ServerInfo with map_name=de_nuke.
	const signon = Buffer.from([14, 52, 26, 12, 152, 36, 232, 29, 144, 149, 125, 185, 213, 173, 149, 1]);
	// Compressed DEM_FileInfo with playback_ticks=42.
	const trailer = Buffer.from([66, 0, 4, 2, 4, 16, 42]);
	const demo = Buffer.concat([
		Buffer.from('PBDEMS2\0\0\0\0\0\0\0\0\0'),
		Buffer.from([65, 255, 255, 255, 255, 15, header.length]),
		header,
		Buffer.from([72, 255, 255, 255, 255, 15, signon.length]),
		signon,
		Buffer.from([0, 0, 0]),
		trailer
	]);
	demo.writeUInt32LE(demo.length - trailer.length, 8);
	const path = join(directory, 'fixture.dem');
	await writeFile(path, demo);
	for (const source of [path, Uint8Array.from(demo), Readable.from([demo])]) {
		const reader = new DemoReader();
		assert(reader._snappy instanceof SnappyDecoder);
		assert.deepEqual(await reader.parseDemo(source), { status: 'complete' });
		assert.equal(reader.header.map_name, 'de_nuke');
	}
	assert.deepEqual(await new DemoReader().parseDemo(path, { stream: false }), { status: 'complete' });
	for (const emitClose of [false, true]) {
		let requested;
		const reading = new Promise(resolve => {
			requested = resolve;
		});
		const stalled = new Readable({
			emitClose,
			read() {
				requested();
			}
		});
		const cancelled = new DemoReader();
		const pending = cancelled.parseDemo(stalled);
		await reading;
		cancelled.cancel();
		assert.deepEqual(await pending, { status: 'cancelled' });
		assert.equal(stalled.destroyed, true);
	}
	let sent = false;
	const withoutEOF = new Readable({
		read() {
			if (!sent) {
				sent = true;
				this.push(demo);
			}
		}
	});
	assert.deepEqual(await new DemoReader().parseDemo(withoutEOF), { status: 'complete' });
	assert.equal(withoutEOF.destroyed, true);
	assert.equal((await DemoReader.parseHeaderAsync(path)).map_name, 'de_nuke');
	for (const source of [path, demo, Uint8Array.from(demo)]) {
		assert.equal(DemoReader.parseHeader(source).map_name, 'de_nuke');
		assert.equal(DemoReader.parseServerInfo(source).map_name, 'de_nuke');
		assert.equal(DemoReader.parseFileInfo(source).playback_ticks, 42);
		assert.deepEqual(DemoReader.parseHeader(source), await DemoReader.parseHeaderAsync(source));
		assert.deepEqual(DemoReader.parseServerInfo(source), await DemoReader.parseServerInfoAsync(source));
		assert.deepEqual(DemoReader.parseFileInfo(source), await DemoReader.parseFileInfoAsync(source));
	}
	for (const method of ['parseHeader', 'parseServerInfo', 'parseFileInfo']) {
		assert.equal(method in BrowserReader, false);
		assert.throws(() => DemoReader[method](new Blob([demo])), TypeError);
		assert.throws(() => DemoReader[method](join(directory, 'missing.dem')));
	}
	for (const read of [DemoReader.parseHeaderAsync, DemoReader.parseFileInfoAsync, DemoReader.parseServerInfoAsync]) {
		await assert.rejects(read(join(directory, 'missing.dem')));
	}
	const browser = new BrowserReader();
	assert.deepEqual(await browser.parseDemo(new Blob([demo]).stream()), { status: 'complete' });
	assert.equal(browser.header.map_name, 'de_nuke');
	for (const Reader of [DemoReader, BrowserReader]) {
		const parser = new Reader();
		const invalid = parser.parseDemo(null);
		assert(invalid instanceof Promise);
		await assert.rejects(invalid, TypeError);
		const corrupt = Buffer.concat([Buffer.alloc(16), Buffer.from([1, 1, 3, 15, 0, 0])]);
		await assert.rejects(parser.parseDemo(corrupt));
		assert.equal(parser.hasEnded, true);
		await assert.rejects(parser.parseDemo(demo), /already been parsed/);
	}
	const output = new Uint8Array(9);
	assert.equal(new SnappyDecoder().uncompress(header, output), output);
	assert.deepEqual(output, Uint8Array.of(42, 7, ...Buffer.from('de_nuke')));
	console.log('Published server and browser exports pass Node smoke checks.');
} finally {
	await rm(directory, { recursive: true, force: true });
}

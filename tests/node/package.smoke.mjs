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
		assert.deepEqual(await reader.parseDemo(source), { incomplete: false });
		assert.equal(reader.header.map_name, 'de_nuke');
	}
	assert.deepEqual(await new DemoReader().parseDemo(path, { stream: false }), { incomplete: false });
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
		assert.deepEqual(await pending, { incomplete: true, reason: 'cancelled' });
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
	assert.deepEqual(await new DemoReader().parseDemo(withoutEOF), { incomplete: false });
	assert.equal(withoutEOF.destroyed, true);
	assert.equal((await DemoReader.parseHeader(path)).map_name, 'de_nuke');
	for (const source of [path, demo, Uint8Array.from(demo)]) {
		assert.equal(DemoReader.parseHeaderSync(source).map_name, 'de_nuke');
		assert.equal(DemoReader.parseServerInfoSync(source).map_name, 'de_nuke');
		assert.equal(DemoReader.parseFileInfoSync(source).playback_ticks, 42);
		assert.deepEqual(DemoReader.parseHeaderSync(source), await DemoReader.parseHeader(source));
		assert.deepEqual(DemoReader.parseServerInfoSync(source), await DemoReader.parseServerInfo(source));
		assert.deepEqual(DemoReader.parseFileInfoSync(source), await DemoReader.parseFileInfo(source));
	}
	for (const method of ['parseHeaderSync', 'parseServerInfoSync', 'parseFileInfoSync']) {
		assert.equal(method in BrowserReader, false);
		assert.throws(() => DemoReader[method](new Blob([demo])), TypeError);
		assert.throws(() => DemoReader[method](join(directory, 'missing.dem')));
	}
	for (const read of [DemoReader.parseHeader, DemoReader.parseFileInfo, DemoReader.parseServerInfo]) {
		await assert.rejects(read(join(directory, 'missing.dem')));
	}
	const browser = new BrowserReader();
	assert.deepEqual(await browser.parseDemo(new Blob([demo]).stream()), { incomplete: false });
	assert.equal(browser.header.map_name, 'de_nuke');
	const output = new Uint8Array(9);
	assert.equal(new SnappyDecoder().uncompress(header, output), output);
	assert.deepEqual(output, Uint8Array.of(42, 7, ...Buffer.from('de_nuke')));
	console.log('Published server and browser exports pass Node smoke checks.');
} finally {
	await rm(directory, { recursive: true, force: true });
}

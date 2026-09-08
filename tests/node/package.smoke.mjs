import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import snappy from 'snappy';
import { DemoReader } from 'cs2parser';
import { DemoReader as BrowserReader, SnappyDecoder } from 'cs2parser/browser';

const directory = await mkdtemp(join(tmpdir(), 'cs2parser-package-'));
try {
	const header = snappy.compressSync(Buffer.from([42, 7, ...Buffer.from('de_nuke')]));
	const demo = Buffer.concat([
		Buffer.from('PBDEMS2\0\0\0\0\0\0\0\0\0'),
		Buffer.from([65, 0, header.length]),
		header,
		Buffer.from([0, 0, 0])
	]);
	const path = join(directory, 'fixture.dem');
	await writeFile(path, demo);
	for (const source of [path, Uint8Array.from(demo), Readable.from([demo])]) {
		const reader = new DemoReader();
		assert.deepEqual(await reader.parseDemo(source), { incomplete: false });
		assert.equal(reader.header.map_name, 'de_nuke');
	}
	assert.deepEqual(await new DemoReader().parseDemo(path, { stream: false }), { incomplete: false });
	let requested;
	const reading = new Promise(resolve => {
		requested = resolve;
	});
	const stalled = new Readable({
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

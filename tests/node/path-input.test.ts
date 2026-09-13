import assert from 'node:assert/strict';
import fs, { type FileHandle } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, afterEach, before, beforeEach, test } from 'node:test';
import { DemoReader, EntityMode, fileDemoSource } from '../../src/index.js';
import { fileHandleDemoSource } from '../../src/replay/node.js';
import { checkpointDemo } from '../helpers/checkpointDemo.js';
import { demoFile, demoFrame } from '../helpers/demo.js';

let directory: string;
let path: string;
const bytes = checkpointDemo({ paddingBytes: 256 * 1024 });
const originalOpen = fs.open;
let opened: FileHandle[];
let onOpen: ((file: FileHandle) => void | Promise<void>) | undefined;

before(async () => {
	directory = await fs.mkdtemp(join(tmpdir(), 'cs2parser-path-'));
	path = join(directory, 'demo.dem');
});
after(async () => fs.rm(directory, { recursive: true, force: true }));
beforeEach(async () => {
	await fs.writeFile(path, bytes);
	opened = [];
	onOpen = undefined;
	fs.open = async (...args) => {
		const file = await originalOpen(...args);
		opened.push(file);
		await onOpen?.(file);
		return file;
	};
});
afterEach(async () => {
	fs.open = originalOpen;
	try {
		assert(
			opened.every(file => file.fd === -1),
			'all handles must close before the operation settles'
		);
	} finally {
		await Promise.all(opened.map(file => file.close().catch(() => {})));
	}
});

test('public file sources retain independent random-access reads without a disposal API', async () => {
	const source = await fileDemoSource(path);
	assert.equal(source.size, bytes.length);
	const ranges = [
		[bytes.length - 31, 31],
		[3, 73],
		[65530, 91]
	] as const;
	const result = await Promise.all(ranges.map(([offset, length]) => source.read(offset, length)));
	for (let i = 0; i < ranges.length; i++) {
		const [offset, length] = ranges[i]!;
		assert.deepEqual(Buffer.from(result[i]!), bytes.subarray(offset, offset + length));
	}
	await new DemoReader().parseDemo(source);
	assert.deepEqual(Buffer.from(await source.read(0, 16)), bytes.subarray(0, 16));
	const abort = new AbortController();
	abort.abort(new Error('aborted'));
	await assert.rejects(source.read(0, 16, abort.signal), error => error === abort.signal.reason);
	await assert.rejects(fileDemoSource(join(directory, 'missing.dem')), /ENOENT/);
	await assert.rejects(fileDemoSource(directory), /regular demo file/);
});

test('owned sources fill short positional reads and never overwrite previously returned storage', async () => {
	const file = await fs.open(path, 'r');
	try {
		const read = file.read.bind(file);
		let calls = 0;
		file.read = (async (buffer: Buffer, offset: number, length: number, position: number) => {
			calls++;
			return read(buffer, offset, Math.min(length, 7), position);
		}) as FileHandle['read'];
		const source = await fileHandleDemoSource(file);
		assert.equal(source.size, bytes.length);
		const ranges = [
			[bytes.length - 37, 37],
			[0, 16],
			[65530, 91]
		] as const;
		const result = await Promise.all(ranges.map(([offset, length]) => source.read(offset, length)));
		await source.read(200, 90);
		for (let i = 0; i < ranges.length; i++) {
			const [offset, length] = ranges[i]!;
			assert.deepEqual(result[i], bytes.subarray(offset, offset + length));
		}
		assert(calls > ranges.length);
		assert.equal((await source.read(source.size, 0)).length, 0);
		const abort = new AbortController();
		abort.abort(new Error('before read'));
		const before = calls;
		await assert.rejects(source.read(0, 16, abort.signal), error => error === abort.signal.reason);
		assert.equal(calls, before);
		await fs.truncate(path, 5);
		await assert.rejects(source.read(0, 16), /Truncated byte source read/);
	} finally {
		await file.close();
	}
});

test('an abort during a short read prevents another read and rejects with the original reason', async () => {
	const file = await fs.open(path, 'r');
	try {
		const read = file.read.bind(file);
		const abort = new AbortController();
		let calls = 0;
		file.read = (async (buffer: Buffer, offset: number, _length: number, position: number) => {
			calls++;
			const result = await read(buffer, offset, 1, position);
			abort.abort(new Error('during read'));
			return result;
		}) as FileHandle['read'];
		const source = await fileHandleDemoSource(file);
		await assert.rejects(source.read(0, 16, abort.signal), error => error === abort.signal.reason);
		assert.equal(calls, 1);
	} finally {
		await file.close();
	}
});

for (const outcome of ['complete', 'incomplete', 'corrupt', 'end listener', 'cancel', 'cancel listener'] as const) {
	test(`path input closes its single handle on ${outcome}`, async () => {
		const reader = new DemoReader();
		const failure = new Error('observer');
		if (outcome === 'incomplete') await fs.writeFile(path, new Uint8Array(8));
		if (outcome === 'corrupt') await fs.writeFile(path, demoFile(demoFrame(1, Uint8Array.of(15))));
		if (outcome === 'end listener')
			reader.prependListener('end', () => {
				throw failure;
			});
		else reader.removeAllListeners('end');
		if (outcome.startsWith('cancel')) reader.once('tickstart', () => reader.cancel());
		if (outcome === 'cancel listener')
			reader.on('cancel', () => {
				throw failure;
			});
		const parsing = reader.parseDemo(path);
		if (outcome === 'end listener' || outcome === 'cancel listener')
			await assert.rejects(parsing, error => error === failure);
		else if (outcome === 'corrupt') await assert.rejects(parsing);
		else assert.deepEqual(await parsing, { status: outcome === 'cancel' ? 'cancelled' : outcome });
		assert.equal(opened.length, 1);
	});
}

test('path input keeps its handle across forward/backward seeks and resume', async () => {
	const reader = new DemoReader();
	const ticks: number[] = [];
	reader.on('tickstart', tick => ticks.push(tick));
	const parsing = reader.parseDemo(path, { entities: EntityMode.ALL, stream: false });
	try {
		await reader.pause();
		assert.equal(opened.length, 1);
		assert.notEqual(opened[0]!.fd, -1);
		for (const tick of [41, 11, 41]) {
			assert.deepEqual(await reader.seekTo(tick), { status: 'complete', tick });
			assert.equal(reader.players[1]?.name, tick === 11 ? 'Alpha' : 'Beta');
			assert.deepEqual(ticks, []);
		}
		reader.resume();
		assert.deepEqual(await parsing, { status: 'complete' });
		assert.deepEqual(ticks, [41, 42]);
		assert.equal(opened.length, 1);
	} finally {
		if (!reader.hasEnded) reader.cancel();
		await parsing;
	}
});

test('cancelling during file setup still closes the late handle and reserves the parser immediately', async () => {
	let release!: () => void;
	const waiting = new Promise<void>(resolve => {
		release = resolve;
	});
	let entered!: () => void;
	const opening = new Promise<void>(resolve => {
		entered = resolve;
	});
	onOpen = async () => {
		entered();
		await waiting;
	};
	const reader = new DemoReader();
	const parsing = reader.parseDemo(path);
	try {
		await opening;
		await assert.rejects(reader.parseDemo(path), /already in progress/);
		reader.cancel();
	} finally {
		release();
	}
	assert.deepEqual(await parsing, { status: 'cancelled' });
	assert.equal(opened.length, 1);
});

test('cancellation while paused drains unused read-ahead before closing the handle', async () => {
	const reader = new DemoReader();
	reader.once('tickend', () => {
		void reader.pause();
	});
	const paused = new Promise<void>(resolve => reader.once('paused', resolve));
	const parsing = reader.parseDemo(path);
	await paused;
	assert.notEqual(opened[0]!.fd, -1);
	reader.cancel();
	assert.deepEqual(await parsing, { status: 'cancelled' });
	assert.equal(opened.length, 1);
});

test('cancelling an active path seek settles both operations and closes the handle', async () => {
	const reader = new DemoReader();
	const parsing = reader.parseDemo(path);
	try {
		await reader.pause();
		const seeking = reader.seekTo(41);
		reader.cancel();
		assert.deepEqual(await Promise.all([seeking, parsing]), [{ status: 'cancelled' }, { status: 'cancelled' }]);
		assert.equal(opened.length, 1);
	} finally {
		if (!reader.hasEnded) reader.cancel();
		await parsing;
	}
});

test('setup and read failures close handles and preserve the primary failure', async () => {
	for (const operation of ['stat', 'read'] as const) {
		const failure = new Error(operation);
		onOpen = file => {
			file[operation] = async () => {
				throw failure;
			};
			const close = file.close.bind(file);
			file.close = async () => {
				await close();
				throw new Error('secondary close failure');
			};
		};
		await assert.rejects(new DemoReader().parseDemo(path), error => error === failure);
	}
	assert.equal(opened.length, 2);
});

test('invalid paths/options do not leak or open special files', async () => {
	await assert.rejects(new DemoReader().parseDemo(join(directory, 'missing.dem')), /ENOENT/);
	await assert.rejects(new DemoReader().parseDemo(directory), /regular demo file/);
	await assert.rejects(new DemoReader().parseDemo(path, { entities: 99 as EntityMode }), /entity/i);
	assert.equal(opened.length, 0);
	await assert.rejects(new DemoReader().parseDemo(path, { maxSeekBytes: 0 }), /maxSeekBytes/);
	assert.equal(opened.length, 1);
});

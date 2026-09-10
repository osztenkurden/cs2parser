import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { Readable } from 'stream';
import snappy from 'snappy';
import { DemoReader } from '../../src/index.js';
import { DemoReader as BrowserDemoReader } from '../../src/browser.js';
import { SnappyDecoder } from '../../src/compression/wasm.js';
import { EDemoCommands } from '../../src/ts-proto/demo.js';
import { bytesField, demoFile, demoFrame } from '../helpers/demo.js';

let tempDir: string;
beforeAll(() => {
	tempDir = mkdtempSync(join(tmpdir(), 'cs2parser-result-'));
});
afterAll(() => rmSync(tempDir, { recursive: true, force: true }));

// A stop frame with three padding bytes satisfies the frame reader's six-byte lookahead.
const completeDemo = Buffer.concat([Buffer.alloc(16), Buffer.from([EDemoCommands.DEM_Stop, 1, 0, 0, 0, 0])]);
// An invalid protobuf wire type triggers a parse error rather than truncated input.
const invalidDemo = Buffer.concat([Buffer.alloc(16), Buffer.from([EDemoCommands.DEM_FileHeader, 1, 3, 0x0f, 0, 0])]);
const stop = demoFrame(EDemoCommands.DEM_Stop);

describe('listener failure lifecycle', () => {
	test.each(['remove', 'prepend'] as const)('end cleanup cannot be bypassed by %s listeners', async mode => {
		const reader = new BrowserDemoReader();
		let releases = 0;
		reader._snappy.release = () => {
			releases++;
		};
		const failure = new Error('end listener');
		if (mode === 'remove') reader.removeAllListeners('end');
		else
			reader.prependListener('end', () => {
				expect(reader.hasEnded).toBe(true);
				expect(releases).toBe(1);
				throw failure;
			});
		const pending = reader.parseDemo(completeDemo);
		if (mode === 'remove') expect(await pending).toEqual({ status: 'complete' });
		else await expect(pending).rejects.toBe(failure);
		expect(reader.hasEnded).toBe(true);
		expect(releases).toBe(1);
		await expect(reader.parseDemo(completeDemo)).rejects.toThrow('already been parsed');
	});

	test.each(['header', 'error', 'debug', 'end'] as const)(
		'%s exceptions reject once and unlock input',
		async event => {
			const reader = new BrowserDemoReader();
			const failure = new Error(`${event} listener`);
			let calls = 0;
			let cancellations = 0;
			let ends = 0;
			let releases = 0;
			reader._snappy.release = () => {
				releases++;
			};
			reader.on('end', () => {
				ends++;
			});
			reader.on(event, () => {
				calls++;
				throw failure;
			});
			const source = new ReadableStream<Uint8Array>({
				start(controller) {
					controller.enqueue(
						event === 'error' ? invalidDemo : demoFile(demoFrame(EDemoCommands.DEM_FileHeader), stop)
					);
				},
				cancel() {
					cancellations++;
				}
			});
			if (event === 'error') await expect(reader.parseDemo(source)).rejects.toBeInstanceOf(Error);
			else await expect(reader.parseDemo(source)).rejects.toBe(failure);
			expect(calls).toBe(1);
			expect(ends).toBe(1);
			expect(releases).toBe(1);
			expect(cancellations).toBe(1);
			expect(source.locked).toBe(false);
			expect(reader.listenerCount('cancel')).toBe(0);
		}
	);

	test('the first callback exception wins over end listener failures, even when it is undefined', async () => {
		const reader = new BrowserDemoReader();
		reader.on('header', () => {
			throw undefined;
		});
		reader.on('end', () => {
			throw new Error('secondary');
		});
		let rejected = false;
		try {
			await reader.parseDemo(demoFile(demoFrame(EDemoCommands.DEM_FileHeader), stop));
		} catch (cause) {
			rejected = true;
			expect(cause).toBeUndefined();
		}
		expect(rejected).toBe(true);
		expect(reader.hasEnded).toBe(true);
	});

	test('an error listener exception does not replace the decoder error in the end payload', async () => {
		const reader = new BrowserDemoReader();
		const failure = new Error('application');
		let decodeError: unknown;
		let endError: unknown;
		reader.on('error', ({ error }) => {
			decodeError = error;
			throw failure;
		});
		reader.on('end', result => {
			if (result.status === 'error') endError = result.error;
		});
		const pending = reader.parseDemo(invalidDemo);
		await expect(pending).rejects.toBeInstanceOf(Error);
		await expect(pending).rejects.toBe(decodeError);
		expect(decodeError).toBeInstanceOf(Error);
		expect(endError).toBe(decodeError);
	});

	test('throwing cancel listeners still end and settle a pending read', async () => {
		const reader = new BrowserDemoReader();
		const failure = new Error('cancel listener');
		let ends = 0;
		reader.on('cancel', () => {
			throw failure;
		});
		reader.on('end', result => {
			ends++;
			expect(result).toEqual({ status: 'cancelled' });
			throw new Error('secondary');
		});
		const source = new ReadableStream<Uint8Array>();
		const pending = reader.parseDemo(source);
		expect(() => reader.cancel()).toThrow(failure);
		await expect(pending).rejects.toBe(failure);
		expect(ends).toBe(1);
		expect(reader.hasEnded).toBe(true);
		expect(source.locked).toBe(false);
	});
});

test('server readers own independent WASM decoders', () => {
	const first = new DemoReader();
	const second = new DemoReader();
	expect(first._snappy).toBeInstanceOf(SnappyDecoder);
	expect(second._snappy).toBeInstanceOf(SnappyDecoder);
	expect(first._snappy).not.toBe(second._snappy);
});

for (const method of ['buffer', 'stream', 'path', 'chunked path'] as const) {
	describe(`parseDemo result (${method})`, () => {
		function parse(reader: DemoReader, buffer: Buffer) {
			if (method === 'buffer') return reader.parseDemo(buffer);
			if (method === 'stream') return reader.parseDemo(Readable.from([buffer]));
			const path = join(tempDir, 'demo.dem');
			writeFileSync(path, buffer);
			return method === 'path' ? reader.parseDemo(path) : reader.parseDemo(path, { stream: false });
		}

		test('returns the exact end event object on success', async () => {
			const reader = new DemoReader();
			const ends: unknown[] = [];
			reader.on('end', result => ends.push(result));

			const result = await parse(reader, completeDemo);

			expect(result).toEqual({ status: 'complete' });
			expect(ends).toHaveLength(1);
			expect(ends[0]).toBe(result);
			expect(reader.hasEnded).toBe(true);
		});

		test('returns incomplete input without an end listener', async () => {
			const result = await parse(new DemoReader(), Buffer.alloc(8));
			expect(result).toEqual({ status: 'incomplete' });
		});

		test('rejects parse errors without end or error listeners', async () => {
			await expect(parse(new DemoReader(), invalidDemo)).rejects.toBeInstanceOf(Error);
		});

		test('a complete frame with truncated protobuf is corrupt, not incomplete input', async () => {
			const corrupt = demoFile(demoFrame(EDemoCommands.DEM_FileHeader, Uint8Array.of(10, 20)));
			await expect(parse(new DemoReader(), corrupt)).rejects.toBeInstanceOf(RangeError);
		});

		test('preserves the same error in diagnostics and the rejected promise', async () => {
			const reader = new DemoReader();
			let emittedError: unknown;
			let endResult: unknown;
			reader.on('error', ({ error }) => {
				emittedError = error;
			});
			reader.on('end', result => {
				endResult = result;
			});

			const pending = parse(reader, invalidDemo);
			await expect(pending).rejects.toBeInstanceOf(Error);
			await expect(pending).rejects.toBe(emittedError);
			expect(endResult).toEqual({ status: 'error', error: emittedError });
		});

		test('returns the cancellation payload', async () => {
			const reader = new DemoReader();
			const ends: unknown[] = [];
			reader.on('end', result => ends.push(result));
			reader.once('tickstart', () => reader.cancel());

			const result = await parse(reader, completeDemo);

			expect(result).toEqual({ status: 'cancelled' });
			expect(ends).toHaveLength(1);
			expect(ends[0]).toBe(result);
		});
	});
}

test('rejects a stream read error without an end listener', async () => {
	const error = new Error('Read failed');
	const stream = new Readable({
		read() {
			this.destroy(error);
		}
	});
	await expect(new DemoReader().parseDemo(stream)).rejects.toBe(error);
});

test.each([DemoReader, BrowserDemoReader])('invalid input and reuse always return promises (%p)', async Reader => {
	const reader = new Reader();
	const invalid = reader.parseDemo(null as any);
	expect(invalid).toBeInstanceOf(Promise);
	await expect(invalid).rejects.toBeInstanceOf(TypeError);
	expect(reader.hasEnded).toBe(false);
	expect(await reader.parseDemo(completeDemo)).toEqual({ status: 'complete' });
	const reused = reader.parseDemo(completeDemo);
	expect(reused).toBeInstanceOf(Promise);
	await expect(reused).rejects.toThrow('already been parsed');
});

test('missing files reject without diagnostic listeners', async () => {
	await expect(new DemoReader().parseDemo(join(tempDir, 'missing.dem'))).rejects.toThrow('ENOENT');
});

test.each([DemoReader, BrowserDemoReader])('invalid options do not consume input or reserve %p', async Reader => {
	for (const opts of [null, { decryptionKey: new Uint8Array(1) }, { entities: 99 }]) {
		const reader = new Reader();
		const source = new ReadableStream<Uint8Array>();
		const pending = reader.parseDemo(source, opts as any);
		expect(pending).toBeInstanceOf(Promise);
		await expect(pending).rejects.toBeInstanceOf(Error);
		expect(source.locked).toBe(false);
		expect(reader.hasEnded).toBe(false);
		expect(await reader.parseDemo(new Uint8Array())).toEqual({ status: 'incomplete' });
	}
});

test('non-Error stream failures are normalized once for rejection and diagnostics', async () => {
	const reader = new BrowserDemoReader();
	let diagnostic: unknown;
	reader.on('end', end => {
		if (end.status === 'error') diagnostic = end.error;
	});
	const source = new ReadableStream<Uint8Array>({
		start(c) {
			c.error('read failed');
		}
	});
	const pending = reader.parseDemo(source);
	await expect(pending).rejects.toThrow('read failed');
	await expect(pending).rejects.toBe(diagnostic);
	expect(source.locked).toBe(false);
});

test.each([false, true])('cancelling a Node stream settles a pending read (emitClose=%s)', async emitClose => {
	let requested!: () => void;
	const reading = new Promise<void>(resolve => {
		requested = resolve;
	});
	let destroys = 0;
	const source = new Readable({
		emitClose,
		read() {
			requested();
		},
		destroy(error, callback) {
			destroys++;
			callback(error);
		}
	});
	const reader = new DemoReader();
	const ends: unknown[] = [];
	reader.on('end', result => ends.push(result));
	const pending = reader.parseDemo(source);
	await reading;
	reader.cancel();
	const result = await pending;
	expect(result).toEqual({ status: 'cancelled' });
	expect(ends).toEqual([result]);
	expect(source.destroyed).toBe(true);
	expect(destroys).toBe(1);
});

test('early completion closes a Node source that never sends EOF', async () => {
	let sent = false;
	const source = new Readable({
		read() {
			if (!sent) {
				sent = true;
				this.push(completeDemo);
			}
		}
	});
	expect(await new DemoReader().parseDemo(source)).toEqual({ status: 'complete' });
	expect(source.destroyed).toBe(true);
});

test('a corrupt complete frame closes a stalled Node source without requesting more input', async () => {
	let sent = false;
	const source = new Readable({
		read() {
			if (!sent) {
				sent = true;
				this.push(demoFile(demoFrame(EDemoCommands.DEM_FileHeader, Uint8Array.of(10, 20))));
			}
		}
	});
	const reader = new DemoReader();
	const timeout = setTimeout(() => reader.cancel(), 1000);
	try {
		await expect(reader.parseDemo(source)).rejects.toBeInstanceOf(RangeError);
		expect(source.destroyed).toBe(true);
	} finally {
		clearTimeout(timeout);
	}
});

test('a corrupt complete frame cancels and unlocks a stalled Web Stream', async () => {
	let cancellations = 0;
	const source = new ReadableStream<Uint8Array>({
		start(controller) {
			controller.enqueue(demoFile(demoFrame(EDemoCommands.DEM_FileHeader, Uint8Array.of(10, 20))));
		},
		cancel() {
			cancellations++;
		}
	});
	const reader = new BrowserDemoReader();
	const timeout = setTimeout(() => reader.cancel(), 1000);
	try {
		await expect(reader.parseDemo(source)).rejects.toBeInstanceOf(RangeError);
		expect(cancellations).toBe(1);
		expect(source.locked).toBe(false);
	} finally {
		clearTimeout(timeout);
	}
});

test('Web cancellation unblocks a pending read and cancels the source exactly once', async () => {
	let cancelled = 0;
	const source = new ReadableStream<Uint8Array>({
		cancel() {
			cancelled++;
		}
	});
	const reader = new BrowserDemoReader();
	const ends: unknown[] = [];
	reader.on('end', result => ends.push(result));
	const parsed = reader.parseDemo(source);
	reader.cancel();
	const result = await parsed;
	expect(result).toEqual({ status: 'cancelled' });
	expect(ends).toEqual([result]);
	expect(ends[0]).toBe(result);
	expect(cancelled).toBe(1);
	expect(source.locked).toBe(false);
});

test('early stop cancels unread Web input without waiting for EOF', async () => {
	let controller!: ReadableStreamDefaultController<Uint8Array>;
	let cancelled = 0;
	const source = new ReadableStream<Uint8Array>({
		start(c) {
			controller = c;
		},
		cancel() {
			cancelled++;
		}
	});
	const parsed = new BrowserDemoReader().parseDemo(source);
	controller.enqueue(demoFile(stop));
	expect(await parsed).toEqual({ status: 'complete' });
	expect(cancelled).toBe(1);
	expect(source.locked).toBe(false);
});

test('Web source failures and invalid chunks reject and release the lock', async () => {
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
		await expect(new BrowserDemoReader().parseDemo(source)).rejects.toBe(error);
		expect(source.locked).toBe(false);
	}
	const source = new ReadableStream({
		start(c) {
			c.enqueue('invalid');
		}
	});
	await expect(new BrowserDemoReader().parseDemo(source as any)).rejects.toBeInstanceOf(TypeError);
	expect(source.locked).toBe(false);
});

test('starting another demo or broadcast does not interrupt an active parse', async () => {
	const reader = new BrowserDemoReader();
	const pending = reader.parseDemo(new ReadableStream<Uint8Array>());
	await expect(reader.parseDemo(demoFile(stop))).rejects.toThrow('already in progress');
	await expect(reader.parseHttpBroadcast('https://unused.invalid/')).rejects.toThrow('already in progress');
	expect(reader.hasEnded).toBe(false);
	reader.cancel();
	expect((await pending).status).toBe('cancelled');
});

test.each(['complete', 'error', 'cancel'])('decoder storage is released after %s', async outcome => {
	const reader = new BrowserDemoReader();
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
	const pending = reader.parseDemo(
		demoFile(header, outcome === 'error' ? demoFrame(EDemoCommands.DEM_FileHeader, Uint8Array.of(10, 255)) : stop)
	);
	if (outcome === 'error') await expect(pending).rejects.toBeInstanceOf(Error);
	else expect(await pending).toEqual({ status: outcome === 'cancel' ? 'cancelled' : 'complete' });
	expect(releases).toBe(1);
});

test('overflowing frame varints fail in both the checked and lookahead paths', async () => {
	for (const padding of [0, 16]) {
		for (const header of [
			[255, 255, 255, 255, 16],
			[1, 255, 255, 255, 255, 128],
			[1, 0, 255, 255, 255, 255, 16]
		]) {
			const bytes = demoFile(Uint8Array.from([...header, ...new Array(padding).fill(0)]));
			for (const source of [bytes, Readable.from([bytes])]) {
				await expect(new DemoReader().parseDemo(source)).rejects.toThrow('Invalid frame varint');
			}
		}
	}
});

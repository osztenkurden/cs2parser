import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { Readable } from 'stream';
import { DemoReader } from '../../src/index.js';
import { DemoReader as BrowserDemoReader } from '../../src/browser.js';
import { EDemoCommands } from '../../src/ts-proto/demo.js';
import { demoFile, demoFrame } from '../helpers/demo.js';

let tempDir: string;
beforeAll(() => {
	tempDir = mkdtempSync(join(tmpdir(), 'cs2parser-result-'));
});
afterAll(() => rmSync(tempDir, { recursive: true, force: true }));

// A stop frame with three padding bytes satisfies the frame reader's six-byte lookahead.
const completeDemo = Buffer.concat([Buffer.alloc(16), Buffer.from([EDemoCommands.DEM_Stop, 1, 0, 0, 0, 0])]);
// An invalid protobuf wire type triggers a parse error rather than truncated input.
const invalidDemo = Buffer.concat([Buffer.alloc(16), Buffer.from([EDemoCommands.DEM_FileHeader, 1, 3, 0x0f, 0, 0])]);

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

			expect(result).toEqual({ incomplete: false });
			expect(ends).toHaveLength(1);
			expect(ends[0]).toBe(result);
			expect(reader.hasEnded).toBe(true);
		});

		test('returns incomplete input without an end listener', async () => {
			const result = await parse(new DemoReader(), Buffer.alloc(8));
			expect(result).toEqual({ incomplete: true });
		});

		test('returns parse errors without end or error listeners', async () => {
			const result = await parse(new DemoReader(), invalidDemo);
			expect(result.error).toBeInstanceOf(Error);
			expect(result.incomplete).toBe(false);
		});

		test('a complete frame with truncated protobuf is corrupt, not incomplete input', async () => {
			const corrupt = demoFile(demoFrame(EDemoCommands.DEM_FileHeader, Uint8Array.of(10, 20)));
			const result = await parse(new DemoReader(), corrupt);
			expect(result.error).toBeInstanceOf(RangeError);
			expect(result.incomplete).toBe(false);
		});

		test('preserves error events and returns the exact end event object', async () => {
			const reader = new DemoReader();
			let emittedError: unknown;
			let endResult: unknown;
			reader.on('error', ({ error }) => {
				emittedError = error;
			});
			reader.on('end', result => {
				endResult = result;
			});

			const result = await parse(reader, invalidDemo);

			expect(endResult).toBe(result);
			expect(result.error).toBeInstanceOf(Error);
			expect(result.error).toBe(emittedError);
		});

		test('returns the cancellation payload', async () => {
			const reader = new DemoReader();
			const ends: unknown[] = [];
			reader.on('end', result => ends.push(result));
			reader.once('tickstart', () => reader.cancel());

			const result = await parse(reader, completeDemo);

			expect(result).toEqual({ incomplete: true, reason: 'cancelled' });
			expect(ends).toHaveLength(1);
			expect(ends[0]).toBe(result);
		});
	});
}

test('returns a stream read error without an end listener', async () => {
	const error = new Error('Read failed');
	const stream = new Readable({
		read() {
			this.destroy(error);
		}
	});
	const result = await new DemoReader().parseDemo(stream);
	expect(result).toEqual({ incomplete: true, error });
	expect(result.error).toBe(error);
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
	expect(result).toEqual({ incomplete: true, reason: 'cancelled' });
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
	expect(await new DemoReader().parseDemo(source)).toEqual({ incomplete: false });
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
		const result = await reader.parseDemo(source);
		expect(result.error).toBeInstanceOf(RangeError);
		expect(result.incomplete).toBe(false);
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
		const result = await reader.parseDemo(source);
		expect(result.error).toBeInstanceOf(RangeError);
		expect(result.incomplete).toBe(false);
		expect(cancellations).toBe(1);
		expect(source.locked).toBe(false);
	} finally {
		clearTimeout(timeout);
	}
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
				const result = await new DemoReader().parseDemo(source);
				expect(result.error?.message).toBe('Invalid frame varint');
				expect(result.incomplete).toBe(false);
			}
		}
	}
});

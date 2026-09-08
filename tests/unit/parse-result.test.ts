import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { Readable } from 'stream';
import { DemoReader } from '../../src/index.js';
import { EDemoCommands } from '../../src/ts-proto/demo.js';

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

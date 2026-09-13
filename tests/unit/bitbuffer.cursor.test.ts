import { expect, test } from 'bun:test';
import { BitBuffer } from '../../src/parser/ubitreader.js';

function bits(bytes: Uint8Array, offset: number, width: number): number {
	let value = 0;
	for (let i = 0; i < width; i++) {
		const position = offset + i;
		value += (((bytes[Math.floor(position / 8)] ?? 0) >>> (position % 8)) & 1) * 2 ** i;
	}
	return value;
}

test('mixed reads, peeks, consumes, copies and skips match a bit-at-a-time cursor', () => {
	let random = 0x6d2b79f5;
	const next = () => (random = (Math.imul(random, 1664525) + 1013904223) >>> 0);
	const storage = Uint8Array.from({ length: 521 }, () => next() >>> 24);
	const reader = new BitBuffer(new Uint8Array(0));
	for (let run = 0; run < 128; run++) {
		const start = next() % 11;
		const source = storage.subarray(start, start + (next() % 511));
		const bytes = run % 2 ? source : source.slice();
		reader.setTo(bytes);
		let offset = 0;
		while (offset < bytes.length * 8) {
			const remaining = bytes.length * 8 - offset;
			expect(reader.PeekUBitsWithLog(32)).toBe(bits(bytes, offset, 32));
			expect(reader.peekHuffmanCode()).toBe(bits(bytes, offset, 17));
			expect(reader.peekHuffmanPrefix()).toBe(bits(bytes, offset, 8));
			expect(reader.ReadUBits(0)).toBe(0);
			reader.consumePeeked(0);
			expect(reader.RemainingBits).toBe(remaining);
			const width = Math.min(1 + (next() % 32), remaining);
			switch (next() % 5) {
				case 0:
					expect(reader.ReadUBits(width)).toBe(bits(bytes, offset, width));
					offset += width;
					break;
				case 1:
					reader.consumePeeked(width);
					offset += width;
					break;
				case 2:
					expect(reader.readBoolean()).toBe(bits(bytes, offset++, 1) !== 0);
					break;
				case 3: {
					const size = Math.min(next() % 49, Math.floor(remaining / 8));
					const output = new Uint8Array(size + 4).fill(0xa5);
					const copy = reader.readBytesToSlice(output.subarray(2), size);
					expect(copy).toEqual(Uint8Array.from({ length: size }, (_, i) => bits(bytes, offset + i * 8, 8)));
					expect(output.subarray(0, 2)).toEqual(Uint8Array.of(0xa5, 0xa5));
					expect(output.subarray(size + 2)).toEqual(Uint8Array.of(0xa5, 0xa5));
					offset += size * 8;
					break;
				}
				case 4: {
					const size = Math.min(next() % 49, Math.floor(remaining / 8));
					reader.skipBytesBetter(size);
					offset += size * 8;
					break;
				}
			}
			expect(reader.RemainingBits).toBe(bytes.length * 8 - offset);
			expect(reader.RemainingBytes).toBe(Math.floor((bytes.length * 8 - offset) / 8));
			if (reader.RemainingBits < 32) {
				expect(() => reader.ReadUBits(reader.RemainingBits + 1)).toThrow('BitBuffer exhausted');
				expect(() => reader.consumePeeked(reader.RemainingBits + 1)).toThrow('BitBuffer exhausted');
				expect(reader.RemainingBits).toBe(bytes.length * 8 - offset);
			}
		}
		expect(reader.PeekUBitsWithLog(32)).toBe(0);
		expect(reader.peekHuffmanCode()).toBe(0);
		expect(reader.peekHuffmanPrefix()).toBe(0);
	}
});

test('Huffman prefixes zero-pad every short sliced tail, including after a full-width consume', () => {
	const storage = new Uint8Array(24).fill(0xff);
	for (let length = 0; length <= 12; length++) {
		const bytes = storage.subarray(3, 3 + length);
		for (let offset = 0; offset <= length * 8; offset++) {
			const reader = new BitBuffer(bytes);
			let skip = offset;
			while (skip >= 32) {
				reader.consumePeeked(32);
				skip -= 32;
			}
			reader.consumePeeked(skip);
			expect(reader.peekHuffmanPrefix()).toBe(bits(bytes, offset, 8));
			expect(reader.RemainingBits).toBe(length * 8 - offset);
		}
	}
});

test('cursor arithmetic does not wrap at signed or unsigned 32-bit bit positions', () => {
	// Reserve a sparse backing store; only the marker pages need to be touched.
	const storage = new Uint8Array(2 ** 29 + 64);
	const bytes = storage.subarray(3, storage.length - 4);
	const marker = Uint8Array.from({ length: 32 }, (_, i) => (i * 97 + 53) & 255);
	for (const boundary of [2 ** 28, 2 ** 29]) bytes.set(marker, boundary - 8);
	const reader = new BitBuffer(new Uint8Array(0));
	for (const boundary of [2 ** 28, 2 ** 29]) {
		for (let alignment = 0; alignment < 8; alignment++) {
			reader.setTo(bytes);
			reader.skipBytesBetter(boundary - 2);
			reader.ReadUBits(alignment);
			let offset = (boundary - 2) * 8 + alignment;
			expect(reader.ReadUBits(32)).toBe(bits(bytes, offset, 32));
			offset += 32;
			expect(reader.peekHuffmanCode()).toBe(bits(bytes, offset, 17));
			const output = new Uint8Array(5);
			reader.readBytes(output);
			expect(output).toEqual(Uint8Array.from({ length: 5 }, (_, i) => bits(bytes, offset + i * 8, 8)));
			offset += 40;
			reader.skipBytesBetter(3);
			offset += 24;
			expect(reader.ReadUBits(32)).toBe(bits(bytes, offset, 32));
			expect(reader.RemainingBits).toBe(bytes.length * 8 - offset - 32);
		}
	}
});

test('byte copies retain destination ownership across source mutation and reader reuse', () => {
	for (let alignment = 0; alignment < 8; alignment++) {
		const source = Uint8Array.from({ length: 40 }, (_, i) => (i * 97 + 53) & 255);
		const reader = new BitBuffer(source.subarray(3, 38));
		reader.ReadUBits(alignment);
		const output = new Uint8Array(32);
		const copied = reader.readBytesToSlice(output, 31);
		const expected = copied.slice();
		expect(copied.buffer).toBe(output.buffer);
		expect(copied.buffer).not.toBe(source.buffer);
		source.fill(0);
		reader.setTo(source);
		reader.readBytes(new Uint8Array(32));
		expect(copied).toEqual(expected);
		output[0] = 0xa5;
		expect(copied[0]).toBe(0xa5);
		expect(source.every(byte => byte === 0)).toBe(true);
	}
});

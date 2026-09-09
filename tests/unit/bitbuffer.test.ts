import { describe, test, expect } from 'bun:test';
import { BitBuffer } from '../../src/parser/ubitreader.js';

function makeBuf(...bytes: number[]): BitBuffer {
	return new BitBuffer(new Uint8Array(bytes));
}

// Independent, bit-at-a-time oracle, including zero padding for peeks.
function sourceBits(bytes: Uint8Array, offset: number, width: number): number {
	let value = 0;
	for (let bit = 0; bit < width; bit++) {
		const position = offset + bit;
		value += (((bytes[Math.floor(position / 8)] ?? 0) >> (position % 8)) & 1) * 2 ** bit;
	}
	return value;
}

function offsetBytes(bytes: Uint8Array, offset: number): Uint8Array {
	const storage = new Uint8Array(Math.ceil((bytes.length * 8 + offset) / 8) + 7).fill(0xa5);
	const output = storage.subarray(3, storage.length - 4);
	output.fill(0);
	for (let bit = 0; bit < bytes.length * 8; bit++) {
		const position = bit + offset;
		output[Math.floor(position / 8)]! |= ((bytes[Math.floor(bit / 8)]! >> (bit % 8)) & 1) << (position % 8);
	}
	return output;
}

function encodeVarint(value: bigint): Uint8Array {
	const bytes: number[] = [];
	do {
		const byte = Number(value % 128n);
		value /= 128n;
		bytes.push(byte + (value > 0n ? 128 : 0));
	} while (value > 0n);
	return Uint8Array.from(bytes);
}

describe('BitBuffer', () => {
	describe('ReadUBits', () => {
		test('reads single bit', () => {
			// 0b00000001 = 1
			const bb = makeBuf(0x01);
			expect(bb.ReadUBits(1)).toBe(1);
			expect(bb.ReadUBits(1)).toBe(0);
		});

		test('reads 8 bits', () => {
			const bb = makeBuf(0xab);
			expect(bb.ReadUBits(8)).toBe(0xab);
		});

		test('reads 16 bits across byte boundary', () => {
			// Little-endian: 0x34, 0x12 -> 0x1234
			const bb = makeBuf(0x34, 0x12);
			expect(bb.ReadUBits(16)).toBe(0x1234);
		});

		test('reads 32 bits', () => {
			const bb = makeBuf(0x78, 0x56, 0x34, 0x12);
			expect(bb.ReadUBits(32)).toBe(0x12345678);
		});

		test('reads non-byte-aligned values', () => {
			// 0b10110100 = 0xb4
			const bb = makeBuf(0xb4);
			expect(bb.ReadUBits(3)).toBe(0b100); // lowest 3 bits
			expect(bb.ReadUBits(5)).toBe(0b10110); // next 5 bits
		});

		test('reads across 32-bit chunk boundary', () => {
			// 5 bytes = 40 bits, read 20 + 20
			const bb = makeBuf(0xff, 0xff, 0x0f, 0x00, 0x00);
			const first20 = bb.ReadUBits(20);
			expect(first20).toBe(0xfffff); // 20 bits of 1s
			const next20 = bb.ReadUBits(20);
			expect(next20).toBe(0);
		});

		test('reads, peeks and consumes every width at every bit alignment', () => {
			const storage = Uint8Array.from({ length: 20 }, (_, i) => (i * 97 + 53) & 255);
			const bytes = storage.subarray(3, 17);
			for (let offset = 0; offset < 64; offset++) {
				for (let width = 0; width <= 32; width++) {
					for (const consume of [false, true]) {
						const reader = new BitBuffer(bytes);
						reader.skipBytesBetter(Math.floor(offset / 8));
						reader.ReadUBits(offset % 8);
						expect(reader.PeekUBitsWithLog(width)).toBe(sourceBits(bytes, offset, width));
						expect(reader.RemainingBits).toBe(bytes.length * 8 - offset);
						if (consume) reader.consumePeeked(width);
						else expect(reader.ReadUBits(width)).toBe(sourceBits(bytes, offset, width));
						expect(reader.RemainingBits).toBe(bytes.length * 8 - offset - width);
						expect(reader.ReadUBits(16)).toBe(sourceBits(bytes, offset + width, 16));
					}
				}
			}
		});

		test('rejects exhaustion without consuming or corrupting the remaining bits', () => {
			const storage = Uint8Array.from({ length: 15 }, (_, i) => (i * 71 + 193) & 255);
			for (let length = 0; length <= 8; length++) {
				const bytes = storage.subarray(3, 3 + length);
				for (let remaining = 0; remaining <= Math.min(31, length * 8); remaining++) {
					const reader = new BitBuffer(bytes);
					const offset = length * 8 - remaining;
					for (let skip = offset; skip > 0; skip -= 32) reader.consumePeeked(Math.min(skip, 32));
					expect(() => reader.ReadUBits(remaining + 1)).toThrow(RangeError);
					expect(() => reader.consumePeeked(remaining + 1)).toThrow(RangeError);
					expect(() => reader.readFloat32LE()).toThrow(RangeError);
					if (remaining < 8) expect(() => reader.ReadByte()).toThrow(RangeError);
					if (remaining === 0) expect(() => reader.readBoolean()).toThrow(RangeError);
					expect(reader.RemainingBits).toBe(remaining);
					expect(reader.PeekUBitsWithLog(32)).toBe(sourceBits(bytes, offset, 32));
					expect(reader.peekHuffmanCode()).toBe(sourceBits(bytes, offset, 17));
					expect(reader.ReadUBits(remaining)).toBe(sourceBits(bytes, offset, remaining));
					expect(reader.RemainingBits).toBe(0);
					expect(reader.ReadUBits(0)).toBe(0);
					reader.consumePeeked(0);
					expect(reader.peekHuffmanCode()).toBe(0);
				}
			}
		});
	});

	describe('readBoolean', () => {
		test('reads individual bits as booleans', () => {
			// 0b00000101 = 5: bits are 1, 0, 1, 0, 0, 0, 0, 0
			const bb = makeBuf(0x05);
			expect(bb.readBoolean()).toBe(true);
			expect(bb.readBoolean()).toBe(false);
			expect(bb.readBoolean()).toBe(true);
			expect(bb.readBoolean()).toBe(false);
		});
	});

	describe('ReadByte', () => {
		test('reads sequential bytes', () => {
			const bb = makeBuf(0x01, 0x02, 0x03);
			expect(bb.ReadByte()).toBe(0x01);
			expect(bb.ReadByte()).toBe(0x02);
			expect(bb.ReadByte()).toBe(0x03);
		});
	});

	describe('readFloat32LE', () => {
		test('matches DataView at every alignment, including special values', () => {
			for (const bits of [
				0, 0x80000000, 1, 0x3f800000, 0xc1234567, 0x7f7fffff, 0x7f800000, 0xff800000, 0x7fc00001
			]) {
				const bytes = new Uint8Array(5);
				const view = new DataView(bytes.buffer);
				view.setUint32(0, bits, true);
				bytes[4] = 0xa5;
				for (let offset = 0; offset < 32; offset++) {
					const reader = new BitBuffer(offsetBytes(bytes, offset));
					reader.ReadUBits(offset);
					expect(reader.readFloat32LE()).toBe(view.getFloat32(0, true));
					expect(reader.ReadByte()).toBe(0xa5);
				}
			}
		});
	});

	describe('ReadUVarInt32', () => {
		test('reads single-byte varint', () => {
			// 0x05 -> value 5 (MSB not set)
			const bb = makeBuf(0x05);
			expect(bb.ReadUVarInt32()).toBe(5);
		});

		test('reads two-byte varint', () => {
			// 300 = 0b100101100
			// varint: 0b10101100 0b00000010 = 0xAC 0x02
			const bb = makeBuf(0xac, 0x02);
			expect(bb.ReadUVarInt32()).toBe(300);
		});

		test('reads max 5-byte varint', () => {
			// 0xFFFFFFFF encoded as varint
			// Each byte: 0xFF 0xFF 0xFF 0xFF 0x0F
			const bb = makeBuf(0xff, 0xff, 0xff, 0xff, 0x0f);
			expect(bb.ReadUVarInt32()).toBe(0xffffffff);
		});

		test('reads zero', () => {
			const bb = makeBuf(0x00);
			expect(bb.ReadUVarInt32()).toBe(0);
		});

		test('reads 128', () => {
			// 128 = 0x80 0x01
			const bb = makeBuf(0x80, 0x01);
			expect(bb.ReadUVarInt32()).toBe(128);
		});

		test('rejects truncated varints on aligned and unaligned input', () => {
			for (let length = 0; length < 5; length++) {
				for (let offset = 0; offset < 8; offset++) {
					const reader = new BitBuffer(offsetBytes(new Uint8Array(length).fill(0x80), offset));
					reader.ReadUBits(offset);
					expect(() => reader.ReadUVarInt32()).toThrow(RangeError);
					expect(reader.RemainingBits).toBe((8 - offset) % 8);
				}
			}
		});
	});

	describe('readVarInt32 (signed zigzag)', () => {
		test('reads positive values', () => {
			// zigzag: 1 -> encoded as 2 (varint 0x02)
			const bb = makeBuf(0x02);
			expect(bb.readVarInt32()).toBe(1);
		});

		test('reads negative values', () => {
			// zigzag: -1 -> encoded as 1 (varint 0x01)
			const bb = makeBuf(0x01);
			expect(bb.readVarInt32()).toBe(-1);
		});

		test('reads zero', () => {
			// zigzag: 0 -> encoded as 0
			const bb = makeBuf(0x00);
			expect(bb.readVarInt32()).toBe(0);
		});

		test('reads -2', () => {
			// zigzag: -2 -> encoded as 3 (varint 0x03)
			const bb = makeBuf(0x03);
			expect(bb.readVarInt32()).toBe(-2);
		});

		test('decodes the signed extremes and the signed-shift boundary', () => {
			for (const value of [
				-2147483648, -2147483647, -1073741825, -1073741824, 1073741823, 1073741824, 2147483646, 2147483647
			]) {
				const encoded = encodeVarint(BigInt(value < 0 ? -value * 2 - 1 : value * 2));
				for (let offset = 0; offset < 8; offset++) {
					const reader = new BitBuffer(offsetBytes(encoded, offset));
					reader.ReadUBits(offset);
					expect(reader.readVarInt32()).toBe(value);
				}
			}
		});
	});

	describe('readString', () => {
		test('reads null-terminated string', () => {
			const bytes = [
				'H'.charCodeAt(0),
				'i'.charCodeAt(0),
				'!'.charCodeAt(0),
				0x00 // null terminator
			];
			const bb = makeBuf(...bytes);
			expect(bb.readString()).toBe('Hi!');
		});

		test('reads empty string', () => {
			const bb = makeBuf(0x00);
			expect(bb.readString()).toBe('');
		});

		test('reads UTF-8 4-byte sequences (emoji)', () => {
			const str = '_🆅🅸🅺_';
			const encoded = new TextEncoder().encode(str);
			const bb = makeBuf(...encoded, 0x00);
			expect(bb.readString()).toBe(str);
		});

		test('reads UTF-8 2-byte sequences (Latin accents)', () => {
			const str = 'café naïve';
			const encoded = new TextEncoder().encode(str);
			const bb = makeBuf(...encoded, 0x00);
			expect(bb.readString()).toBe(str);
		});

		test('reads UTF-8 3-byte sequences (Cyrillic)', () => {
			const str = 'Привет';
			const encoded = new TextEncoder().encode(str);
			const bb = makeBuf(...encoded, 0x00);
			expect(bb.readString()).toBe(str);
		});

		test('preserves strings at and beyond the scratch boundary, including split UTF-8', () => {
			for (const str of [
				'x'.repeat(4095),
				'x'.repeat(4096),
				'x'.repeat(4097),
				'x'.repeat(4095) + '\u{1f680}' + 'y'.repeat(5000)
			]) {
				const bytes = new TextEncoder().encode(str + '\0next\0');
				for (const offset of [0, 1, 7]) {
					const reader = new BitBuffer(offsetBytes(bytes, offset));
					reader.ReadUBits(offset);
					expect(reader.readString()).toBe(str);
					expect(reader.readString()).toBe('next');
				}
			}
		});

		test('rejects missing terminators, even at a partial-byte tail', () => {
			for (const length of [0, 1, 4096, 4097]) {
				for (const offset of [0, 1, 7]) {
					const reader = new BitBuffer(offsetBytes(new Uint8Array(length).fill(0x61), offset));
					reader.ReadUBits(offset);
					expect(() => reader.readString()).toThrow(RangeError);
				}
			}
		});
	});

	describe('readBytes', () => {
		test('reads byte-aligned bytes', () => {
			const bb = makeBuf(0xaa, 0xbb, 0xcc, 0xdd);
			const out = Buffer.alloc(4);
			bb.readBytes(out);
			expect(out[0]).toBe(0xaa);
			expect(out[1]).toBe(0xbb);
			expect(out[2]).toBe(0xcc);
			expect(out[3]).toBe(0xdd);
		});

		test('reads non-byte-aligned bytes', () => {
			// Read 1 bit first, then read bytes
			const bb = makeBuf(0xff, 0x00, 0x00, 0x00, 0x00);
			bb.readBoolean(); // consume 1 bit
			const out = Buffer.alloc(2);
			bb.readBytes(out);
			// After reading bit 0 (=1), remaining bits shift:
			// 0xff >> 1 = 0x7f in first byte, then crosses boundary
			expect(out[0]).toBe(0x7f);
			expect(out[1]).toBe(0x00);
		});

		test('copies sliced input and output at all alignments and word/tail boundaries', () => {
			const sizes = [
				0, 1, 2, 3, 4, 5, 7, 8, 9, 15, 16, 17, 31, 32, 33, 63, 64, 65, 255, 256, 257, 4095, 4096, 4097
			];
			const storage = Uint8Array.from({ length: 4112 }, (_, i) => (i * 97 + 53) & 255);
			for (let offset = 0; offset < 32; offset++) {
				for (const size of sizes) {
					const bytes = storage.subarray(3, 3 + size + 9);
					const expected = Uint8Array.from({ length: size }, (_, i) => sourceBits(bytes, offset + i * 8, 8));
					for (const slice of [false, true]) {
						const reader = new BitBuffer(bytes);
						reader.ReadUBits(offset);
						const outputStorage = new Uint8Array(size + 13).fill(0xa5);
						const output = outputStorage.subarray(7, 7 + size + (slice ? 2 : 0));
						if (slice) {
							const result = reader.readBytesToSlice(output, size);
							expect(result.buffer).toBe(output.buffer);
							expect(result.byteOffset).toBe(output.byteOffset);
							expect(result.length).toBe(size);
						} else reader.readBytes(output);
						expect(output.subarray(0, size)).toEqual(expected);
						expect(outputStorage.subarray(0, 7)).toEqual(new Uint8Array(7).fill(0xa5));
						expect(outputStorage.subarray(7 + size)).toEqual(new Uint8Array(6).fill(0xa5));
						expect(reader.RemainingBits).toBe(bytes.length * 8 - offset - size * 8);
						expect(reader.ReadUBits(32)).toBe(sourceBits(bytes, offset + size * 8, 32));
					}
				}
			}
		});

		test('rejects incomplete copies before touching the reader or destination', () => {
			for (let length = 0; length <= 9; length++) {
				for (let offset = 0; offset < 8 && offset <= length * 8; offset++) {
					const bytes = new Uint8Array(length).fill(0xff);
					const reader = new BitBuffer(bytes);
					reader.ReadUBits(offset);
					const remaining = length * 8 - offset;
					const output = new Uint8Array(Math.floor(remaining / 8) + 1).fill(0xa5);
					expect(() => reader.readBytes(output)).toThrow(RangeError);
					expect(() => reader.readBytesToSlice(output, output.length)).toThrow(RangeError);
					expect(output.every(byte => byte === 0xa5)).toBe(true);
					expect(reader.RemainingBits).toBe(remaining);
					expect(reader.peekHuffmanCode()).toBe(sourceBits(bytes, offset, 17));
					const wholeBytes = Math.floor(remaining / 8);
					expect(reader.readBytesToSlice(output, wholeBytes)).toEqual(new Uint8Array(wholeBytes).fill(0xff));
					expect(reader.RemainingBits).toBe(remaining % 8);
				}
			}
		});

		test('rejects invalid sizes and destinations that are too small', () => {
			const reader = new BitBuffer(new Uint8Array(16).fill(0xff));
			const output = new Uint8Array(4).fill(0xa5);
			for (const size of [-1, 0.5, NaN, Infinity, -Infinity, 5, Number.MAX_SAFE_INTEGER + 1]) {
				expect(() => reader.readBytesToSlice(output, size)).toThrow(RangeError);
				expect(reader.RemainingBits).toBe(128);
				expect(output).toEqual(new Uint8Array(4).fill(0xa5));
			}
		});
	});

	describe('skipBytesBetter', () => {
		test('skips within current buffer', () => {
			const bb = makeBuf(0x01, 0x02, 0x03, 0x04, 0x05);
			bb.skipBytesBetter(2);
			expect(bb.ReadByte()).toBe(0x03);
		});

		test('skips across chunk boundary', () => {
			// 8 bytes total, skip first 5
			const bb = makeBuf(0x00, 0x00, 0x00, 0x00, 0x00, 0xaa, 0xbb, 0xcc);
			bb.skipBytesBetter(5);
			expect(bb.ReadByte()).toBe(0xaa);
		});

		test('preserves unaligned positions through the last complete byte', () => {
			const bytes = Uint8Array.from({ length: 16 }, (_, i) => (i * 71 + 193) & 255);
			for (let offset = 0; offset < 32; offset++) {
				for (let size = 0; size <= Math.floor((bytes.length * 8 - offset) / 8); size++) {
					const reader = new BitBuffer(bytes);
					reader.ReadUBits(offset);
					reader.skipBytesBetter(size);
					const remaining = bytes.length * 8 - offset - size * 8;
					expect(reader.RemainingBits).toBe(remaining);
					expect(reader.ReadUBits(Math.min(remaining, 32))).toBe(
						sourceBits(bytes, offset + size * 8, Math.min(remaining, 32))
					);
				}
			}
		});

		test('rejects invalid sizes and exhaustion without moving the cursor', () => {
			const reader = makeBuf(0xff, 0xff, 0xff, 0xff, 0xff);
			reader.ReadUBits(1);
			for (const size of [-1, 0.5, NaN, Infinity, -Infinity, 5, Number.MAX_SAFE_INTEGER + 1]) {
				expect(() => reader.skipBytesBetter(size)).toThrow(RangeError);
				expect(reader.RemainingBits).toBe(39);
			}
			reader.skipBytesBetter(4);
			expect(reader.ReadUBits(7)).toBe(127);
			reader.skipBytesBetter(0);
			expect(reader.RemainingBits).toBe(0);
			expect(() => reader.skipBytesBetter(1)).toThrow(RangeError);
		});
	});

	describe('readUbitVar', () => {
		test('reads small value (no high bits set)', () => {
			// Value 5: lowest 6 bits = 0b000101, bits 4&5 = 00 -> no extension
			const bb = makeBuf(0x05, 0x00, 0x00, 0x00);
			expect(bb.readUbitVar()).toBe(5);
		});
	});

	describe('readUbitVarFp', () => {
		test('reads 2-bit value when first boolean is true', () => {
			// First bit = 1 (true), then 2-bit value
			// 0b00000_11_1 = bits: 1(bool=true), 11(value=3)
			const bb = makeBuf(0b00000_111, 0x00, 0x00, 0x00);
			expect(bb.readUbitVarFp()).toBe(3);
		});
	});

	describe('readBitCoord', () => {
		test('reads zero (no int, no frac)', () => {
			// First 2 booleans = false, false
			const bb = makeBuf(0x00, 0x00, 0x00, 0x00);
			expect(bb.readBitCoord()).toBe(0);
		});
	});

	describe('decodeNormal', () => {
		test('reads positive normal', () => {
			// isNegative = false (bit 0 = 0), then 11 bits for length
			// 0b0_00000000001 packed into bytes (little-endian bits)
			// First bit: 0 (not negative)
			// Next 11 bits: value 1 -> 0b00000000001
			// Together: 0b00000000010 = 0x002
			const bb = makeBuf(0x02, 0x00, 0x00, 0x00);
			const result = bb.decodeNormal();
			// length=1, result = 1 * (1/2048 - 1) = 1/2048 - 1
			expect(result).toBeCloseTo(1 * (1 / 2048 - 1), 10);
		});

		test('reads negative normal', () => {
			// isNegative = true (bit 0 = 1), then 11 bits for length = 1
			// bits: 1 (negative), 10000000000 (length=1 in LE bit order)
			// byte 0: bit0=1, bits1-7=1000000 -> 0b00000011 = 0x03
			const bb = makeBuf(0x03, 0x00, 0x00, 0x00);
			const result = bb.decodeNormal();
			expect(result).toBeCloseTo(-(1 * (1 / 2048 - 1)), 10);
		});
	});

	describe('decodeNormalVec', () => {
		test('returns [0, 0, 1] when no X and no Y', () => {
			// hasX = false, hasY = false, neg_z = false
			const bb = makeBuf(0x00, 0x00, 0x00, 0x00);
			const v = bb.decodeNormalVec();
			expect(v[0]).toBe(0);
			expect(v[1]).toBe(0);
			expect(v[2]).toBeCloseTo(1.0, 10);
		});

		test('returns [0, 0, -1] when neg_z', () => {
			// hasX = false (0), hasY = false (0), neg_z = true (1)
			// Bits: 0, 0, 1 -> 0b100 = 0x04
			const bb = makeBuf(0x04, 0x00, 0x00, 0x00);
			const v = bb.decodeNormalVec();
			expect(v[0]).toBe(0);
			expect(v[1]).toBe(0);
			expect(v[2]).toBeCloseTo(-1.0, 10);
		});
	});

	describe('decodeQangleVariant', () => {
		test('returns [0, 0, 0] when no axes set', () => {
			const bb = makeBuf(0x00, 0x00, 0x00, 0x00);
			const result = bb.decodeQangleVariant();
			expect(result).toEqual([0, 0, 0]);
		});
	});

	describe('RemainingBytes / RemainingBits', () => {
		test('reports correct remaining after reads', () => {
			const bb = makeBuf(0x01, 0x02, 0x03, 0x04);
			expect(bb.RemainingBits).toBe(32);
			expect(bb.RemainingBytes).toBe(4);
			bb.ReadByte();
			expect(bb.RemainingBits).toBe(24);
			expect(bb.RemainingBytes).toBe(3);
		});
	});

	describe('readUVarInt64', () => {
		test('reads small 64-bit value', () => {
			const bb = makeBuf(0x05);
			expect(bb.readUVarInt64()).toBe(5n);
		});

		test('reads larger 64-bit value', () => {
			// 300 as varint: 0xAC 0x02
			const bb = makeBuf(0xac, 0x02);
			expect(bb.readUVarInt64()).toBe(300n);
		});

		test('retains full precision at every bit boundary through uint64 max', () => {
			const values = new Set([0n, (1n << 64n) - 1n, 0x0123456789abcdefn, 0xfedcba9876543210n]);
			for (let bit = 0n; bit < 64n; bit++) {
				values.add((1n << bit) - 1n);
				values.add(1n << bit);
				values.add((1n << bit) + 1n);
			}
			for (const value of values) {
				const encoded = encodeVarint(value);
				for (let offset = 0; offset < 8; offset++) {
					const reader = new BitBuffer(offsetBytes(Uint8Array.from([...encoded, 0xa5]), offset));
					reader.ReadUBits(offset);
					expect(reader.readUVarInt64()).toBe(value);
					expect(reader.ReadByte()).toBe(0xa5);
				}
			}
		});

		test('accepts non-minimal encodings that still fit in ten bytes', () => {
			expect(makeBuf(...new Array(9).fill(0x80), 0).readUVarInt64()).toBe(0n);
			expect(makeBuf(0x81, ...new Array(8).fill(0x80), 0).readUVarInt64()).toBe(1n);
		});

		test('rejects overflow or continuation in byte ten without reading byte eleven', () => {
			for (const lastByte of [2, 0x7f, 0x80, 0x81, 0xff]) {
				for (let offset = 0; offset < 8; offset++) {
					const reader = new BitBuffer(
						offsetBytes(Uint8Array.from([...new Array(9).fill(0xff), lastByte, 0xa5]), offset)
					);
					reader.ReadUBits(offset);
					expect(() => reader.readUVarInt64()).toThrow('MALFORMED U64');
					expect(reader.ReadByte()).toBe(0xa5);
				}
			}
		});

		test('rejects truncated varints instead of zero-padding a terminator', () => {
			for (let length = 0; length < 10; length++) {
				for (let offset = 0; offset < 8; offset++) {
					const reader = new BitBuffer(offsetBytes(new Uint8Array(length).fill(0x80), offset));
					reader.ReadUBits(offset);
					expect(() => reader.readUVarInt64()).toThrow(RangeError);
					expect(reader.RemainingBits).toBe((8 - offset) % 8);
				}
			}
		});
	});

	describe('decudeUint64', () => {
		test('reads fixed-width uint64 values without alignment or slice assumptions', () => {
			for (const value of [
				0n,
				1n,
				0xffffffffn,
				0x100000000n,
				0x0123456789abcdefn,
				0xfedcba9876543210n,
				0xffffffffffffffffn
			]) {
				const bytes = new Uint8Array(9);
				new DataView(bytes.buffer).setBigUint64(0, value, true);
				bytes[8] = 0xa5;
				for (let offset = 0; offset < 8; offset++) {
					const reader = new BitBuffer(offsetBytes(bytes, offset));
					reader.ReadUBits(offset);
					expect(reader.decudeUint64()).toBe(value);
					expect(reader.ReadByte()).toBe(0xa5);
				}
			}
		});

		test('rejects short input before consuming either word', () => {
			for (let remaining = 0; remaining < 64; remaining++) {
				const reader = new BitBuffer(new Uint8Array(8).fill(0xff));
				for (let skip = 64 - remaining; skip > 0; skip -= 32) reader.consumePeeked(Math.min(skip, 32));
				expect(() => reader.decudeUint64()).toThrow(RangeError);
				expect(reader.RemainingBits).toBe(remaining);
			}
		});
	});

	describe('setTo', () => {
		test('resets to new buffer', () => {
			const bb = makeBuf(0x01, 0x02);
			bb.ReadByte(); // read 1 byte
			bb.setTo(new Uint8Array([0xaa, 0xbb]));
			expect(bb.ReadByte()).toBe(0xaa);
			expect(bb.ReadByte()).toBe(0xbb);
		});

		test('resets across different slices of the same backing buffer, including short tails', () => {
			const storage = Uint8Array.from({ length: 24 }, (_, i) => (i * 97 + 53) & 255);
			const reader = new BitBuffer(storage.subarray(1, 9));
			for (let offset = 0; offset < 8; offset++) {
				for (let length = 0; length <= 8; length++) {
					const bytes = storage.subarray(offset, offset + length);
					expect(reader.setTo(bytes)).toBe(reader);
					expect(reader.RemainingBytes).toBe(length);
					for (let bit = 0; bit < length * 8; bit += 32) {
						const width = Math.min(32, length * 8 - bit);
						expect(reader.ReadUBits(width)).toBe(sourceBits(bytes, bit, width));
					}
					expect(() => reader.ReadByte()).toThrow(RangeError);
				}
			}
		});
	});

	test('Huffman peeks match the source bits without consuming them', () => {
		const storage = Uint8Array.from({ length: 44 }, (_, i) => (i * 97 + 53) & 255);
		for (let length = 1; length <= 40; length++) {
			const bytes = storage.subarray(3, 3 + length);
			for (let offset = 0; offset < length * 8; offset++) {
				const reader = new BitBuffer(bytes);
				for (let skip = offset; skip > 0; skip -= 32) reader.ReadUBits(Math.min(skip, 32));
				let expected = 0;
				for (let bit = 0; bit < 17; bit++) {
					const position = offset + bit;
					expected |= (((bytes[position >>> 3] ?? 0) >>> (position & 7)) & 1) << bit;
				}
				expect(reader.peekHuffmanCode()).toBe(expected);
				expect(reader.RemainingBits).toBe(length * 8 - offset);
			}
		}
	});
});

/**
 * Phase 2 parity check: the Rust `BitBufferNative` produces the same outputs
 * as the JS `BitBuffer` on every method the entity decoder hot-path uses.
 *
 * Mirrors `bitbuffer.test.ts` byte-for-byte. The JS suite continues to test
 * the TypeScript `BitBuffer` directly so we have an independent reference;
 * this file holds the Rust port to the same standard. Both run on every
 * `bun test` and both must stay green until Phase 7 retires the JS impl.
 */
import { describe, test, expect } from 'bun:test';
import { native } from '../../src/native/index.js';

function makeBuf(...bytes: number[]) {
	return new native.BitBufferNative(new Uint8Array(bytes));
}

describe('BitBufferNative (Rust)', () => {
	describe('ReadUBits', () => {
		test('reads single bit', () => {
			const bb = makeBuf(0x01);
			expect(bb.ReadUBits(1)).toBe(1);
			expect(bb.ReadUBits(1)).toBe(0);
		});

		test('reads 8 bits', () => {
			const bb = makeBuf(0xab);
			expect(bb.ReadUBits(8)).toBe(0xab);
		});

		test('reads 16 bits across byte boundary', () => {
			const bb = makeBuf(0x34, 0x12);
			expect(bb.ReadUBits(16)).toBe(0x1234);
		});

		test('reads 32 bits', () => {
			const bb = makeBuf(0x78, 0x56, 0x34, 0x12);
			expect(bb.ReadUBits(32)).toBe(0x12345678);
		});

		test('reads non-byte-aligned values', () => {
			const bb = makeBuf(0xb4);
			expect(bb.ReadUBits(3)).toBe(0b100);
			expect(bb.ReadUBits(5)).toBe(0b10110);
		});

		test('reads across 32-bit chunk boundary', () => {
			const bb = makeBuf(0xff, 0xff, 0x0f, 0x00, 0x00);
			expect(bb.ReadUBits(20)).toBe(0xfffff);
			expect(bb.ReadUBits(20)).toBe(0);
		});
	});

	describe('readBoolean', () => {
		test('reads individual bits as booleans', () => {
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

	describe('ReadUVarInt32', () => {
		test('reads single-byte varint', () => {
			expect(makeBuf(0x05).ReadUVarInt32()).toBe(5);
		});
		test('reads two-byte varint', () => {
			expect(makeBuf(0xac, 0x02).ReadUVarInt32()).toBe(300);
		});
		test('reads max 5-byte varint', () => {
			expect(makeBuf(0xff, 0xff, 0xff, 0xff, 0x0f).ReadUVarInt32()).toBe(0xffffffff);
		});
		test('reads zero', () => {
			expect(makeBuf(0x00).ReadUVarInt32()).toBe(0);
		});
		test('reads 128', () => {
			expect(makeBuf(0x80, 0x01).ReadUVarInt32()).toBe(128);
		});
	});

	describe('readVarInt32 (signed zigzag)', () => {
		test('reads positive values', () => {
			expect(makeBuf(0x02).readVarInt32()).toBe(1);
		});
		test('reads negative values', () => {
			expect(makeBuf(0x01).readVarInt32()).toBe(-1);
		});
		test('reads zero', () => {
			expect(makeBuf(0x00).readVarInt32()).toBe(0);
		});
		test('reads -2', () => {
			expect(makeBuf(0x03).readVarInt32()).toBe(-2);
		});
	});

	describe('readString', () => {
		test('reads null-terminated string', () => {
			const bytes = ['H'.charCodeAt(0), 'i'.charCodeAt(0), '!'.charCodeAt(0), 0x00];
			expect(makeBuf(...bytes).readString()).toBe('Hi!');
		});
		test('reads empty string', () => {
			expect(makeBuf(0x00).readString()).toBe('');
		});
		test('reads UTF-8 4-byte sequences (emoji)', () => {
			const str = '_🆅🅸🅺_';
			const enc = new TextEncoder().encode(str);
			expect(makeBuf(...enc, 0x00).readString()).toBe(str);
		});
		test('reads UTF-8 2-byte sequences (Latin accents)', () => {
			const str = 'café naïve';
			const enc = new TextEncoder().encode(str);
			expect(makeBuf(...enc, 0x00).readString()).toBe(str);
		});
		test('reads UTF-8 3-byte sequences (Cyrillic)', () => {
			const str = 'Привет';
			const enc = new TextEncoder().encode(str);
			expect(makeBuf(...enc, 0x00).readString()).toBe(str);
		});
	});

	describe('readBytes', () => {
		// NB: Rust wrapper signature differs from JS (Rust allocates the return
		// buffer; JS mutates a passed-in one). The bit math is what matters here.
		test('reads byte-aligned bytes', () => {
			const bb = makeBuf(0xaa, 0xbb, 0xcc, 0xdd);
			const out = bb.readBytes(4);
			expect(out[0]).toBe(0xaa);
			expect(out[1]).toBe(0xbb);
			expect(out[2]).toBe(0xcc);
			expect(out[3]).toBe(0xdd);
		});
		test('reads non-byte-aligned bytes', () => {
			const bb = makeBuf(0xff, 0x00, 0x00, 0x00, 0x00);
			bb.readBoolean();
			const out = bb.readBytes(2);
			expect(out[0]).toBe(0x7f);
			expect(out[1]).toBe(0x00);
		});
	});

	describe('skipBytesBetter', () => {
		test('skips within current buffer', () => {
			const bb = makeBuf(0x01, 0x02, 0x03, 0x04, 0x05);
			bb.skipBytesBetter(2);
			expect(bb.ReadByte()).toBe(0x03);
		});
		test('skips across chunk boundary', () => {
			const bb = makeBuf(0x00, 0x00, 0x00, 0x00, 0x00, 0xaa, 0xbb, 0xcc);
			bb.skipBytesBetter(5);
			expect(bb.ReadByte()).toBe(0xaa);
		});
	});

	describe('readUbitVar', () => {
		test('reads small value (no high bits set)', () => {
			expect(makeBuf(0x05, 0x00, 0x00, 0x00).readUbitVar()).toBe(5);
		});
	});

	describe('readUbitVarFp', () => {
		test('reads 2-bit value when first boolean is true', () => {
			expect(makeBuf(0b00000_111, 0x00, 0x00, 0x00).readUbitVarFp()).toBe(3);
		});
	});

	describe('readBitCoord', () => {
		test('reads zero (no int, no frac)', () => {
			expect(makeBuf(0x00, 0x00, 0x00, 0x00).readBitCoord()).toBe(0);
		});
	});

	describe('decodeNormal', () => {
		test('reads positive normal', () => {
			const result = makeBuf(0x02, 0x00, 0x00, 0x00).decodeNormal();
			expect(result).toBeCloseTo(1 * (1 / 2048 - 1), 6);
		});
		test('reads negative normal', () => {
			const result = makeBuf(0x03, 0x00, 0x00, 0x00).decodeNormal();
			expect(result).toBeCloseTo(-(1 * (1 / 2048 - 1)), 6);
		});
	});

	describe('decodeNormalVec', () => {
		test('returns [0, 0, 1] when no X and no Y', () => {
			const v = makeBuf(0x00, 0x00, 0x00, 0x00).decodeNormalVec();
			expect(v[0]).toBe(0);
			expect(v[1]).toBe(0);
			expect(v[2]).toBeCloseTo(1.0, 10);
		});
		test('returns [0, 0, -1] when neg_z', () => {
			const v = makeBuf(0x04, 0x00, 0x00, 0x00).decodeNormalVec();
			expect(v[0]).toBe(0);
			expect(v[1]).toBe(0);
			expect(v[2]).toBeCloseTo(-1.0, 10);
		});
	});

	describe('decodeQangleVariant', () => {
		test('returns [0, 0, 0] when no axes set', () => {
			expect(makeBuf(0x00, 0x00, 0x00, 0x00).decodeQangleVariant()).toEqual([0, 0, 0]);
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
			expect(makeBuf(0x05).readUVarInt64()).toBe(5n);
		});
		test('reads larger 64-bit value', () => {
			expect(makeBuf(0xac, 0x02).readUVarInt64()).toBe(300n);
		});
	});

	describe('setTo', () => {
		test('resets to new buffer', () => {
			const bb = makeBuf(0x01, 0x02);
			bb.ReadByte();
			bb.setTo(new Uint8Array([0xaa, 0xbb]));
			expect(bb.ReadByte()).toBe(0xaa);
			expect(bb.ReadByte()).toBe(0xbb);
		});
	});
});

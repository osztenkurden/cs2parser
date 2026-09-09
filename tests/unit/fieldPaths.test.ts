import { describe, expect, test } from 'bun:test';
import { BitBuffer } from '../../src/parser/ubitreader.js';
import { parsePaths } from '../../src/parser/entities/fieldPaths.js';
import { doOp, type FieldPath } from '../../src/parser/entities/fieldPathOps.js';

// Frozen LSB-first codes from the original 17-bit table, indexed by opcode.
const codes: [number, number][] = [
	[0, 1],
	[7, 4],
	[19, 6],
	[251, 8],
	[11, 5],
	[2843, 12],
	[21275, 15],
	[91, 8],
	[3, 5],
	[59, 8],
	[155, 8],
	[15, 4],
	[219, 9],
	[4891, 16],
	[103195, 17],
	[37659, 17],
	[95003, 17],
	[29467, 17],
	[127771, 17],
	[62235, 17],
	[78619, 17],
	[13083, 17],
	[111387, 17],
	[45851, 17],
	[41755, 16],
	[8987, 16],
	[443, 9],
	[17179, 15],
	[58139, 16],
	[51, 6],
	[27, 9],
	[187, 9],
	[123, 8],
	[25371, 16],
	[33563, 16],
	[795, 16],
	[1819, 11],
	[475, 9],
	[283, 10],
	[1, 2]
];

class BitWriter {
	bits: number[] = [];
	write(value: number, length: number): this {
		for (let i = 0; i < length; i++) this.bits.push((value >>> i) & 1);
		return this;
	}
	buffer(): Uint8Array {
		const backing = new Uint8Array(Math.ceil(this.bits.length / 8) + 11).fill(0xff);
		const bytes = backing.subarray(3, 3 + Math.ceil(this.bits.length / 8));
		bytes.fill(0);
		for (let i = 0; i < this.bits.length; i++) bytes[i >>> 3]! |= this.bits[i]! << (i & 7);
		return bytes;
	}
}

const initialPath = (): FieldPath => ({ path: [-1, 0, 0, 0, 0, 0, 0], last: 0 });
const serializer = { name: 'Test', fields: [] };

describe('field-path Huffman decoding', () => {
	test.each(codes.map((_, opcode) => opcode))('original opcode %i at all 32 bit offsets', opcode => {
		const initial = initialPath();
		const initialPayload = new BitWriter().write(1, 5).write(2, 5).write(3, 5).buffer();
		doOp(20, new BitBuffer(initialPayload), initial);
		const expected: FieldPath = { path: [...initial.path], last: initial.last };
		const operands = new BitBuffer(new Uint8Array(128));
		doOp(opcode, operands, expected);
		const operandBits = 1024 - operands.RemainingBits;
		for (let offset = 0; offset < 32; offset++) {
			const writer = new BitWriter()
				.write(0x76543210, offset)
				.write(...codes[20]!)
				.write(1, 5)
				.write(2, 5)
				.write(3, 5)
				.write(...codes[opcode]!);
			for (let i = 0; i < operandBits; i++) writer.write(0, 1);
			if (opcode !== 39) writer.write(...codes[39]!);
			const consumed = writer.bits.length;
			const bytes = writer.write(0xabcde123, 32).buffer();
			const reader = new BitBuffer(bytes);
			if (offset) reader.ReadUBits(offset);
			const actual: FieldPath[] = [];
			const count = parsePaths(
				reader,
				{
					fieldPath: initialPath(),
					writeFp(fp, index) {
						expect(index).toBe(actual.length);
						actual.push({ path: [...fp.path], last: fp.last });
					}
				},
				serializer
			);
			expect(actual).toEqual(opcode === 39 ? [initial] : [initial, expected]);
			expect(count).toBe(actual.length);
			expect(reader.RemainingBits).toBe(bytes.length * 8 - consumed);
			expect(reader.ReadUBits(32)).toBe(0xabcde123);
		}
	});

	test('truncated codes fail without consuming a partial code, including long fallback prefixes', () => {
		for (const [code, width] of codes) {
			for (let available = 0; available < width; available++) {
				const offset = (8 - (available & 7)) & 7;
				const reader = new BitBuffer(new BitWriter().write(0, offset).write(code, available).buffer());
				if (offset) reader.ReadUBits(offset);
				expect(() =>
					parsePaths(
						reader,
						{
							fieldPath: initialPath(),
							writeFp() {
								throw new Error('Truncated code emitted a field path');
							}
						},
						serializer
					)
				).toThrow('BitBuffer exhausted');
				expect(reader.RemainingBits).toBe(available);
			}
		}
	});

	test('short finish codes need only their actual bits, not a whole lookup window', () => {
		const reader = new BitBuffer(
			new BitWriter()
				.write(0, 6)
				.write(...codes[39]!)
				.buffer()
		);
		reader.ReadUBits(6);
		expect(
			parsePaths(
				reader,
				{
					fieldPath: initialPath(),
					writeFp() {
						throw new Error('Unexpected field');
					}
				},
				serializer
			)
		).toBe(0);
		expect(reader.RemainingBits).toBe(0);
	});

	test.each([
		[1, 1, 2],
		[2, 2, 4],
		[4, 3, 10],
		[8, 4, 17],
		[0, 4, 31]
	])('PlusN prefix %i/%i preserves a %i-bit delta', (prefix, prefixWidth, width) => {
		const value = 2 ** width - 1;
		for (let offset = 0; offset < 32; offset++) {
			const reader = new BitBuffer(
				new BitWriter()
					.write(0, offset)
					.write(...codes[4]!)
					.write(prefix, prefixWidth)
					.write(value, width)
					.write(...codes[39]!)
					.write(0x1234abcd, 32)
					.buffer()
			);
			if (offset) reader.ReadUBits(offset);
			const paths: number[] = [];
			expect(
				parsePaths(
					reader,
					{
						fieldPath: initialPath(),
						writeFp(fp) {
							paths.push(fp.path[0]);
						}
					},
					serializer
				)
			).toBe(1);
			expect(paths).toEqual([value + 4]);
			expect(reader.ReadUBits(32)).toBe(0x1234abcd);
		}
	});

	test('nested parsing with another owner cannot corrupt the current scratch path', () => {
		const reader = new BitBuffer(
			new BitWriter()
				.write(...codes[0]!)
				.write(...codes[0]!)
				.write(...codes[39]!)
				.buffer()
		);
		const paths: FieldPath[] = [];
		parsePaths(
			reader,
			{
				fieldPath: initialPath(),
				writeFp(fp, index) {
					paths.push({ path: [...fp.path], last: fp.last });
					if (index === 0) {
						const nested = new BitBuffer(
							new BitWriter()
								.write(...codes[7]!)
								.write(...codes[39]!)
								.buffer()
						);
						parsePaths(nested, { fieldPath: initialPath(), writeFp() {} }, serializer);
					}
				}
			},
			serializer
		);
		expect(paths).toEqual([
			{ path: [0, 0, 0, 0, 0, 0, 0], last: 0 },
			{ path: [1, 0, 0, 0, 0, 0, 0], last: 0 }
		]);
	});
});

test('small Huffman peek zero-pads view ends without consuming or leaking neighboring bytes', () => {
	const backing = Uint8Array.from({ length: 24 }, (_, i) => (i * 117 + 91) & 255);
	for (const bytes of [backing, backing.subarray(3, 19), backing.subarray(4, 4)]) {
		const reader = new BitBuffer(new Uint8Array(0));
		for (let offset = 0; offset <= bytes.length * 8; offset++) {
			reader.setTo(bytes);
			let remaining = offset;
			while (remaining) {
				const size = Math.min(32, remaining);
				reader.ReadUBits(size);
				remaining -= size;
			}
			let expected = 0;
			for (let bit = 0; bit < 8; bit++) {
				const index = offset + bit;
				if (index < bytes.length * 8) expected |= ((bytes[index >>> 3]! >>> (index & 7)) & 1) << bit;
			}
			expect(reader.peekHuffmanPrefix()).toBe(expected);
			expect(reader.RemainingBits).toBe(bytes.length * 8 - offset);
			if (offset < bytes.length * 8) expect(reader.readBoolean()).toBe(Boolean(expected & 1));
		}
	}
});

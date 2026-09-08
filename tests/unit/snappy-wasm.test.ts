import { describe, expect, test } from 'bun:test';
import snappy from 'snappy';
import { SnappyDecoder, snappyUncompressedLength } from '../../src/compression/wasm.js';
import { varint } from '../helpers/demo.js';

const literal = (bytes: Uint8Array): Uint8Array => {
	const n = bytes.length - 1;
	const header =
		n < 60
			? [n << 2]
			: n < 256
				? [240, n]
				: n < 65536
					? [244, n & 255, n >>> 8]
					: [248, n & 255, (n >>> 8) & 255, n >>> 16];
	return Uint8Array.from([...header, ...bytes]);
};

describe('standalone WASM Snappy', () => {
	test('matches native decoding across sizes, literals, and repetitive data', () => {
		const decoder = new SnappyDecoder();
		let seed = 0x12345678;
		for (const length of [0, 1, 4, 59, 60, 61, 255, 256, 4096, 65535, 65536, 131073, 1048576]) {
			for (const pattern of ['random', 'repeated', 'periodic']) {
				const input = new Uint8Array(length);
				for (let i = 0; i < length; i++) {
					seed ^= seed << 13;
					seed ^= seed >>> 17;
					seed ^= seed << 5;
					input[i] = pattern === 'random' ? seed & 255 : pattern === 'repeated' ? 65 : i % 101;
				}
				const compressed = snappy.compressSync(input);
				expect(snappyUncompressedLength(compressed)).toBe(length);
				expect(decoder.uncompress(compressed)).toEqual(input);
			}
		}
	});

	test('supports all copy tags, overlapping copies, and offsets above 65535', () => {
		const decoder = new SnappyDecoder();
		for (const [size, copy] of [
			[1, [29, 1]], // one-byte offset, overlapping run of 11
			[1, [254, 1, 0]], // two-byte offset, overlapping run of 64
			[2047, [225, 255]], // high offset bits in the one-byte tag
			[65536, [15, 0, 0, 1, 0]] // four-byte offset, 4 bytes
		] as const) {
			const bytes = Uint8Array.from({ length: size }, (_, i) => i & 255);
			const copied = copy[0]! === 29 ? 11 : copy[0]! === 254 ? 64 : 4;
			const block = Uint8Array.from([...varint(size + copied), ...literal(bytes), ...copy]);
			expect(decoder.uncompress(block)).toEqual(Uint8Array.from(snappy.uncompressSync(block) as Buffer));
		}
	});

	test('writes to caller-owned slices and preserves surrounding bytes', () => {
		const decoder = new SnappyDecoder();
		const compressed = snappy.compressSync(Uint8Array.of(1, 2, 3));
		const arena = new Uint8Array(16).fill(99);
		const output = decoder.uncompress(compressed.subarray(0), arena.subarray(5, 12));
		expect(output.buffer).toBe(arena.buffer);
		expect(output.byteOffset).toBe(5);
		expect(Array.from(arena)).toEqual([99, 99, 99, 99, 99, 1, 2, 3, 99, 99, 99, 99, 99, 99, 99, 99]);
		expect(() => decoder.uncompress(compressed, new Uint8Array(2))).toThrow('too small');
	});

	test('reuses frame storage while owned results survive subsequent decompressions and growth', () => {
		const decoder = new SnappyDecoder();
		const compressed = snappy.compressSync(new Uint8Array(2048).fill(42));
		const owned = decoder.uncompress(compressed);
		const first = decoder.uncompressFrame(compressed);
		const second = decoder.uncompressFrame(snappy.compressSync(new Uint8Array(1024).fill(17)));
		expect(second.buffer).toBe(first.buffer);
		decoder.uncompressFrame(snappy.compressSync(new Uint8Array(200000).fill(7)));
		expect(owned).toEqual(new Uint8Array(2048).fill(42));
	});

	test('rejects malformed lengths, literals, copy offsets, and trailing input', () => {
		const decoder = new SnappyDecoder();
		for (const bytes of [
			[],
			[128],
			[255, 255, 255, 255, 16],
			[1],
			[1, 0],
			[1, 0, 65, 0, 66],
			[1, 1, 0],
			[1, 2, 1, 0],
			[2, 0, 65, 2, 2, 0],
			[2, 0, 65, 1, 1],
			[1, 240],
			[1, 252, 255, 255, 255, 255],
			[1, 3, 1]
		])
			expect(() => decoder.uncompress(Uint8Array.from(bytes))).toThrow();
	});

	test('agrees with the native decoder on deterministic mutated blocks', () => {
		const decoder = new SnappyDecoder();
		const original = snappy.compressSync(Uint8Array.from({ length: 2048 }, (_, i) => i % 31));
		for (let i = 1; i < original.length; i++) {
			for (const mask of [1, 31, 128, 255]) {
				const mutated = Uint8Array.from(original);
				mutated[i]! ^= mask;
				let expected: Uint8Array;
				try {
					expected = snappy.uncompressSync(mutated) as Buffer;
				} catch {
					expect(() => decoder.uncompress(mutated)).toThrow();
					continue;
				}
				expect(decoder.uncompress(mutated)).toEqual(Uint8Array.from(expected));
			}
		}
	});
});

test('snapshot baselines retain their bytes when the frame buffer is reused', async () => {
	const { applyStringTableSnapshot } = await import('../../src/parser/stringtables.js');
	const decoder = new SnappyDecoder();
	const frame = decoder.uncompressFrame(snappy.compressSync(new Uint8Array(1024).fill(42)));
	const baselines: Uint8Array[] = [];
	applyStringTableSnapshot(
		{ table_name: 'instancebaseline', items: [{ str: '7', data: frame.subarray(10, 20) }], items_clientside: [] },
		baselines
	);
	decoder.uncompressFrame(snappy.compressSync(new Uint8Array(1024).fill(17)));
	expect(baselines[7]).toEqual(new Uint8Array(10).fill(42));
});

import { describe, expect, test } from 'bun:test';
import snappy from 'snappy';
import { SnappyDecoder, snappyUncompressedLength } from '../../src/compression/wasm.js';
import { snappyWasmBase64 } from '../../src/compression/snappyWasmBytes.js';
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

	test('matches native at every copy length across short offsets and wide-copy boundaries', () => {
		const decoder = new SnappyDecoder();
		for (let offset = 1; offset <= 70; offset++) {
			const prefix = literal(Uint8Array.from({ length: offset }, (_, i) => (i * 19 + 7) & 255));
			for (let length = 1; length <= 64; length++) {
				for (const kind of [1, 2, 3]) {
					if (kind === 1 && (length < 4 || length > 11)) continue;
					const copy =
						kind === 1
							? [((length - 4) << 2) | 1, offset]
							: [((length - 1) << 2) | kind, offset, 0, ...(kind === 3 ? [0, 0] : [])];
					const block = Uint8Array.from([...varint(offset + length), ...prefix, ...copy]);
					expect(decoder.uncompress(block)).toEqual(Uint8Array.from(snappy.uncompressSync(block) as Buffer));
				}
			}
		}
	});

	test('the standalone artifact has no imports and does not overread or overwrite wide-copy tails', () => {
		const module = new WebAssembly.Module(Uint8Array.from(atob(snappyWasmBase64), c => c.charCodeAt(0)));
		expect(WebAssembly.Module.imports(module)).toEqual([]);
		const wasm = new WebAssembly.Instance(module).exports as unknown as {
			memory: WebAssembly.Memory;
			__heap_base: WebAssembly.Global;
			snappy_uncompress(input: number, length: number, output: number, outputLength: number): number;
		};
		wasm.memory.grow(4);
		const memory = new Uint8Array(wasm.memory.buffer);
		const heap = Number(wasm.__heap_base.value) + 1;
		for (const length of [...Array.from({ length: 72 }, (_, i) => i + 1), 255, 256, 65535, 65536, 65537]) {
			const expected = Uint8Array.from({ length }, (_, i) => i & 255);
			const block = Uint8Array.from([...varint(length), ...literal(expected)]);
			// Exercise both an input ending at memory's limit and an output ending there.
			for (const inputAtEnd of [false, true]) {
				const input = inputAtEnd ? memory.length - block.length : heap;
				const output = inputAtEnd ? heap : memory.length - length;
				memory.fill(99);
				memory.set(block, input);
				expect(wasm.snappy_uncompress(input, block.length, output, length)).toBe(0);
				expect(memory.subarray(output, output + length)).toEqual(expected);
				expect(memory[output - 1]).toBe(99);
				if (inputAtEnd) expect(memory[output + length]).toBe(99);
			}
		}
		for (let offset = 1; offset <= 16; offset++) {
			for (let length = 1; length <= 64; length++) {
				const prefix = literal(Uint8Array.from({ length: offset }, (_, i) => i + 1));
				const block = Uint8Array.from([
					...varint(offset + length),
					...prefix,
					((length - 1) << 2) | 2,
					offset,
					0
				]);
				const output = memory.length - offset - length;
				memory.fill(99);
				memory.set(block, heap);
				expect(wasm.snappy_uncompress(heap, block.length, output, offset + length)).toBe(0);
				expect(memory.subarray(output)).toEqual(Uint8Array.from(snappy.uncompressSync(block) as Buffer));
				expect(memory[output - 1]).toBe(99);
			}
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

	test('supports overlapping input and destination slices, including the same view', () => {
		const decoder = new SnappyDecoder();
		const expected = Uint8Array.from({ length: 4096 }, (_, i) => i % 251);
		const compressed = snappy.compressSync(expected);
		for (const [inputOffset, outputOffset] of [
			[11, 7],
			[7, 11],
			[11, 11],
			[4093, 7],
			[7, 4100]
		] as const) {
			const arena = new Uint8Array(9000).fill(99);
			arena.set(compressed, inputOffset);
			const before = arena.slice();
			const input = arena.subarray(inputOffset, inputOffset + compressed.length);
			const destination = arena.subarray(outputOffset, outputOffset + expected.length + 13);
			const result = decoder.uncompress(input, destination);
			expect(result).toEqual(expected);
			expect(result.buffer).toBe(arena.buffer);
			expect(result.byteOffset).toBe(outputOffset);
			expect(arena.subarray(0, outputOffset)).toEqual(before.subarray(0, outputOffset));
			expect(arena.subarray(outputOffset + expected.length)).toEqual(
				before.subarray(outputOffset + expected.length)
			);
		}
		const small = Uint8Array.from({ length: 127 }, (_, i) => i);
		const same = Uint8Array.from(snappy.compressSync(small));
		const tail = same.slice(small.length);
		expect(decoder.uncompress(same, same)).toEqual(small);
		expect(same.subarray(small.length)).toEqual(tail);
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

	test('nested decompressions do not overwrite a live frame, even when WASM memory grows', () => {
		const decoder = new SnappyDecoder();
		const nested = new Uint8Array(300000).fill(37);
		const compressed = snappy.compressSync(nested);
		const contents = new Uint8Array(compressed.length + 23).fill(99);
		contents.set(compressed, 11);
		const frame = decoder.uncompressFrame(snappy.compressSync(contents));
		const input = frame.subarray(11, 11 + compressed.length);
		const owned = decoder.uncompress(input);
		expect(owned).toEqual(nested);
		expect(frame).toEqual(contents);
		expect(decoder.uncompress(input, new Uint8Array(nested.length))).toEqual(nested);
		expect(frame).toEqual(contents);
		// Reusing scratch as the *input* of the next frame is safe too.
		expect(decoder.uncompressFrame(input)).toEqual(nested);
		decoder.uncompressFrame(snappy.compressSync(new Uint8Array(400000).fill(13)));
		expect(owned).toEqual(nested);
	});

	test('caches the memory view until growth and drops per-decoder storage on repeated release', () => {
		const decoder = new SnappyDecoder();
		const state = decoder as unknown as { wasm?: unknown; memory?: Uint8Array; frameBuffer?: Uint8Array };
		const retained: Uint8Array[] = [];
		decoder.release();
		decoder.release();
		for (const length of [64, 200000, 4096]) {
			const compressed = snappy.compressSync(new Uint8Array(length).fill(42));
			retained.push(decoder.uncompress(compressed));
			decoder.uncompressFrame(compressed);
			const memory = state.memory;
			const frame = state.frameBuffer;
			decoder.uncompressFrame(compressed);
			expect(state.memory).toBe(memory);
			expect(state.frameBuffer).toBe(frame);
			decoder.uncompressFrame(snappy.compressSync(new Uint8Array(1000000).fill(17)));
			expect(state.memory).not.toBe(memory);
			expect(memory!.byteLength).toBe(0); // The old WASM buffer was detached by growth.
			const grown = state.memory;
			decoder.uncompress(compressed);
			expect(state.memory).toBe(grown);
			decoder.release();
			decoder.release();
			expect(state.wasm).toBeUndefined();
			expect(state.memory).toBeUndefined();
			expect(state.frameBuffer).toBeUndefined();
		}
		for (const output of retained) expect(output).toEqual(new Uint8Array(output.length).fill(42));

		const Module = WebAssembly.Module;
		WebAssembly.Module = new Proxy(Module, {
			construct() {
				throw new Error('The compiled module should survive release');
			}
		});
		try {
			for (const reusable of [decoder, new SnappyDecoder()]) {
				expect(reusable.uncompress(Uint8Array.of(1, 0, 42))).toEqual(Uint8Array.of(42));
				reusable.release();
			}
		} finally {
			WebAssembly.Module = Module;
		}
	});

	test('rejects tiny blocks advertising huge output before any allocation or WASM growth', () => {
		const warm = new SnappyDecoder();
		warm.uncompressFrame(Uint8Array.of(1, 0, 42));
		const decoders = [new SnappyDecoder(), warm];
		const blocks = [0x1000000, 0x7fffffff, 0xfffffffe, 0xffffffff].map(length =>
			Uint8Array.from([...varint(length), 0, 42])
		);
		const destination = new Uint8Array(16);
		const Uint8 = globalThis.Uint8Array;
		const Instance = WebAssembly.Instance;
		const grow = WebAssembly.Memory.prototype.grow;
		let allocations = 0;
		const fail = () => {
			allocations++;
			throw new Error('Unexpected allocation');
		};
		const errors: unknown[] = [];
		globalThis.Uint8Array = new Proxy(Uint8, { construct: fail });
		WebAssembly.Instance = new Proxy(Instance, { construct: fail });
		WebAssembly.Memory.prototype.grow = fail;
		try {
			for (const decoder of decoders) {
				for (const block of blocks) {
					for (const decode of [
						() => decoder.uncompress(block),
						() => decoder.uncompress(block, destination),
						() => decoder.uncompressFrame(block)
					]) {
						try {
							decode();
							errors.push(undefined);
						} catch (error) {
							errors.push(error);
						}
					}
				}
			}
		} finally {
			globalThis.Uint8Array = Uint8;
			WebAssembly.Instance = Instance;
			WebAssembly.Memory.prototype.grow = grow;
		}
		expect(allocations).toBe(0);
		for (const error of errors) expect((error as Error)?.message).toContain('impossible output length');
		expect(warm.uncompressFrame(Uint8Array.of(1, 0, 17))).toEqual(Uint8Array.of(17));
	});

	test('allows valid blocks approaching the maximum expansion ratio without a small size cap', () => {
		const copies = 262144;
		const length = 1 + copies * 64;
		const prefix = varint(length);
		const block = new Uint8Array(prefix.length + 2 + copies * 3);
		block.set(prefix);
		block.set([0, 42], prefix.length);
		for (let i = prefix.length + 2; i < block.length; i += 3) block.set([254, 1, 0], i);
		const decoder = new SnappyDecoder();
		expect(decoder.uncompressFrame(block)).toEqual(Uint8Array.from(snappy.uncompressSync(block) as Buffer));
		decoder.release();
	});

	test('rejects malformed lengths, literals, copy offsets, and trailing input', () => {
		const decoder = new SnappyDecoder();
		const frame = decoder.uncompressFrame(Uint8Array.of(1, 0, 42));
		const destination = new Uint8Array(16).fill(99);
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
		]) {
			const block = Uint8Array.from(bytes);
			expect(() => decoder.uncompress(block)).toThrow();
			expect(() => decoder.uncompress(block, destination)).toThrow();
			expect(() => decoder.uncompressFrame(block)).toThrow();
			expect(frame).toEqual(Uint8Array.of(42));
			expect(destination).toEqual(new Uint8Array(16).fill(99));
		}
		expect(decoder.uncompressFrame(Uint8Array.of(1, 0, 17))).toEqual(Uint8Array.of(17));
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

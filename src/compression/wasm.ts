import type { SnappyDecoder as Decoder } from './types.js';
import { snappyWasmBase64 } from './snappyWasmBytes.js';

let compiled: WebAssembly.Module | undefined;

interface SnappyExports {
	memory: WebAssembly.Memory;
	__heap_base: WebAssembly.Global;
	snappy_uncompress(input: number, length: number, output: number, outputLength: number): number;
}

/** Read the raw Snappy block's uint32 length without allocating its output. */
export function snappyUncompressedLength(input: Uint8Array): number {
	let length = 0;
	for (let shift = 0, i = 0; shift < 35; shift += 7, i++) {
		const byte = input[i];
		if (byte === undefined || (shift === 28 && byte > 15)) break;
		length |= (byte & 127) << shift;
		if (!(byte & 128)) return length >>> 0;
	}
	throw new Error('Invalid Snappy length');
}

/** Raw Snappy decoding with reusable WASM memory and optional caller-owned output. */
export class SnappyDecoder implements Decoder {
	private wasm?: SnappyExports;
	private memory?: Uint8Array;
	private frameBuffer?: Uint8Array;

	uncompress(input: Uint8Array, output?: Uint8Array): Uint8Array {
		return this.decode(input, output);
	}

	/** @internal Scratch output is valid until the next frame or release on this decoder. */
	uncompressFrame(input: Uint8Array): Uint8Array {
		return this.decode(input, undefined, true);
	}

	/** Drop per-decoder storage; the compiled module stays reusable, as does this decoder. */
	release(): void {
		this.wasm = undefined;
		this.memory = undefined;
		this.frameBuffer = undefined;
	}

	private decode(input: Uint8Array, output?: Uint8Array, frame = false): Uint8Array {
		const length = snappyUncompressedLength(input);
		// COPY_2 emits at most 64 bytes per 3 input bytes; all other tags expand less.
		// Including the prefix makes this conservative, without imposing a size cap or
		// scanning the whole block twice. Check before allocating scratch or WASM memory.
		if (length * 3 > input.length * 64) throw new Error('Invalid Snappy block: impossible output length');
		if (output && output.length < length) throw new RangeError('Snappy output buffer is too small');
		if (!this.wasm) {
			compiled ??= new WebAssembly.Module(Uint8Array.from(atob(snappyWasmBase64), c => c.charCodeAt(0)));
			this.wasm = new WebAssembly.Instance(compiled).exports as unknown as SnappyExports;
			this.memory = new Uint8Array(this.wasm.memory.buffer);
		}
		const wasm = this.wasm;
		let memory = this.memory!;
		const inputOffset = Number(wasm.__heap_base.value);
		const outputOffset = inputOffset + input.length;
		const required = outputOffset + length;
		if (required > 0xffffffff) throw new RangeError('Snappy block exceeds WASM address space');
		if (required > memory.length) {
			const capacity = Math.min(0x100000000, Math.max(required, memory.length * 2));
			wasm.memory.grow(Math.ceil((capacity - memory.length) / 65536));
			this.memory = memory = new Uint8Array(wasm.memory.buffer);
		}
		memory.set(input, inputOffset);
		if (wasm.snappy_uncompress(inputOffset, input.length, outputOffset, length) !== 0) {
			throw new Error('Invalid Snappy block');
		}
		if (frame) {
			if (!this.frameBuffer || this.frameBuffer.length < length) {
				this.frameBuffer = new Uint8Array(Math.max(length, (this.frameBuffer?.length ?? 0) * 2));
			}
			output = this.frameBuffer;
		}
		const destination = output ?? new Uint8Array(length);
		destination.set(memory.subarray(outputOffset, outputOffset + length));
		return destination.length === length ? destination : destination.subarray(0, length);
	}
}

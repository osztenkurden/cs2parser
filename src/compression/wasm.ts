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
	private frameBuffer = new Uint8Array(0);

	uncompress(input: Uint8Array, output?: Uint8Array): Uint8Array {
		const length = snappyUncompressedLength(input);
		if (output && output.length < length) throw new RangeError('Snappy output buffer is too small');
		if (!this.wasm) {
			compiled ??= new WebAssembly.Module(Uint8Array.from(atob(snappyWasmBase64), c => c.charCodeAt(0)));
			this.wasm = new WebAssembly.Instance(compiled).exports as unknown as SnappyExports;
		}
		const wasm = this.wasm;
		const inputOffset = Number(wasm.__heap_base.value);
		const outputOffset = inputOffset + input.length;
		const required = outputOffset + length;
		if (required > 0xffffffff) throw new RangeError('Snappy block exceeds WASM address space');
		if (required > wasm.memory.buffer.byteLength) {
			const capacity = Math.min(0x100000000, Math.max(required, wasm.memory.buffer.byteLength * 2));
			wasm.memory.grow(Math.ceil((capacity - wasm.memory.buffer.byteLength) / 65536));
		}
		const memory = new Uint8Array(wasm.memory.buffer);
		memory.set(input, inputOffset);
		if (wasm.snappy_uncompress(inputOffset, input.length, outputOffset, length) !== 0) {
			throw new Error('Invalid Snappy block');
		}
		const destination = output ?? new Uint8Array(length);
		destination.set(memory.subarray(outputOffset, outputOffset + length));
		return destination.length === length ? destination : destination.subarray(0, length);
	}

	/** @internal Scratch output is valid until the next frame on this decoder. */
	uncompressFrame(input: Uint8Array): Uint8Array {
		const length = snappyUncompressedLength(input);
		if (this.frameBuffer.length < length) {
			this.frameBuffer = new Uint8Array(Math.max(length, this.frameBuffer.length * 2));
		}
		return this.uncompress(input, this.frameBuffer);
	}
}

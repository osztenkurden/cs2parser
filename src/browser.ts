import { BaseDemoReader } from './parser/base.js';
import { SnappyDecoder } from './compression/wasm.js';
import { parseHeaderAsync, parseServerInfoAsync, parseFileInfoAsync, type MetadataInput } from './parser/metadata.js';

/** Browser entry: shared parsing with standalone WASM Snappy and Web Streams. */
export class DemoReader extends BaseDemoReader {
	constructor() {
		super(new SnappyDecoder());
	}

	static async parseHeaderAsync(source: MetadataInput) {
		return parseHeaderAsync(source, new SnappyDecoder());
	}
	static async parseServerInfoAsync(source: MetadataInput) {
		return parseServerInfoAsync(source, new SnappyDecoder());
	}
	static async parseFileInfoAsync(source: MetadataInput) {
		return parseFileInfoAsync(source, new SnappyDecoder());
	}
}

export { SnappyDecoder, snappyUncompressedLength } from './compression/wasm.js';
export * from './shared.js';

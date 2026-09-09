import { BaseDemoReader } from './parser/base.js';
import { SnappyDecoder } from './compression/wasm.js';
import { parseHeader, parseServerInfo, parseFileInfo, type MetadataInput } from './parser/metadata.js';

/** Browser entry: shared parsing with standalone WASM Snappy and Web Streams. */
export class DemoReader extends BaseDemoReader {
	constructor() {
		super(new SnappyDecoder());
	}

	static parseHeader(source: MetadataInput) {
		return parseHeader(source, new SnappyDecoder());
	}
	static parseServerInfo(source: MetadataInput) {
		return parseServerInfo(source, new SnappyDecoder());
	}
	static parseFileInfo(source: MetadataInput) {
		return parseFileInfo(source, new SnappyDecoder());
	}
}

export { SnappyDecoder, snappyUncompressedLength } from './compression/wasm.js';
export * from './shared.js';

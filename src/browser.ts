import { BaseDemoReader } from './parser/base.js';
import { SnappyDecoder } from './compression/wasm.js';
import { parseHeader, parseServerInfo, parseFileInfo, type MetadataInput } from './parser/metadata.js';

const metadataSnappy = new SnappyDecoder();

/** Browser entry: shared parsing with standalone WASM Snappy and Web Streams. */
export class DemoReader extends BaseDemoReader {
	constructor() {
		super(new SnappyDecoder());
	}

	static parseHeader(source: MetadataInput) {
		return parseHeader(source, metadataSnappy);
	}
	static parseServerInfo(source: MetadataInput) {
		return parseServerInfo(source, metadataSnappy);
	}
	static parseFileInfo(source: MetadataInput) {
		return parseFileInfo(source, metadataSnappy);
	}
}

export { SnappyDecoder, snappyUncompressedLength } from './compression/wasm.js';
export * from './shared.js';

import { createReadStream, openAsBlob } from 'node:fs';
import { stat } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { BaseDemoReader, type DemoInput, type ParseOptions } from './base.js';
import { SnappyDecoder } from '../compression/wasm.js';
import { parseHeaderAsync, parseServerInfoAsync, parseFileInfoAsync, type MetadataInput } from './metadata.js';
import { parseMetadataSync } from './metadataSync.js';

const metadataSource = async (source: string | MetadataInput) => {
	if (typeof source !== 'string') return source;
	// Bun's lazy file Blob reports size 0 for a missing path. Preserve I/O errors.
	await stat(source);
	return openAsBlob(source);
};

/** Server entry: shared parsing with WASM Snappy and Node file/stream inputs. */
export class DemoReader extends BaseDemoReader {
	constructor() {
		super(new SnappyDecoder());
	}

	static async parseHeaderAsync(source: string | MetadataInput) {
		return parseHeaderAsync(await metadataSource(source), new SnappyDecoder());
	}

	static async parseServerInfoAsync(source: string | MetadataInput) {
		return parseServerInfoAsync(await metadataSource(source), new SnappyDecoder());
	}

	static async parseFileInfoAsync(source: string | MetadataInput) {
		return parseFileInfoAsync(await metadataSource(source), new SnappyDecoder());
	}

	/** Synchronously read the header from a file path or bytes. Blocks the calling thread. */
	static parseHeader(source: string | Uint8Array) {
		return parseMetadataSync(source, 'header');
	}

	/** Synchronously scan signon metadata from a file path or bytes. Blocks the calling thread. */
	static parseServerInfo(source: string | Uint8Array) {
		return parseMetadataSync(source, 'serverInfo');
	}

	/** Synchronously read the file-info trailer from a file path or bytes. Blocks the calling thread. */
	static parseFileInfo(source: string | Uint8Array) {
		return parseMetadataSync(source, 'fileInfo');
	}

	override parseDemo(source: string | DemoInput | Readable, opts: ParseOptions & { stream?: boolean } = {}) {
		this.assertCanParse();
		if (typeof source === 'string') {
			// Keep the chunked path option while sharing the same parsing loop.
			source = createReadStream(source, { highWaterMark: opts.stream === false ? 4 * 1024 * 1024 : 64 * 1024 });
		}
		if (source instanceof Readable) {
			const stream = source;
			return this.parseSource(() => {
				const iterator = stream[Symbol.asyncIterator]();
				return {
					read: () => iterator.next(),
					async cancel(reason?: unknown) {
						// Destroy first: iterator.return() alone can wait forever on a pending read.
						// An error also wakes iterators whose stream disables the close event.
						stream.destroy(reason instanceof Error ? reason : undefined);
						await iterator.return?.();
					}
				};
			}, opts);
		}
		return super.parseDemo(source, opts);
	}
}

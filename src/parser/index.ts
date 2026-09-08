import { createReadStream, openAsBlob } from 'node:fs';
import { stat } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { BaseDemoReader, type DemoInput, type ParseOptions } from './base.js';
import { nativeSnappy } from '../compression/native.js';
import { parseHeader, parseServerInfo, parseFileInfo, type MetadataInput } from './metadata.js';

const metadataSource = async (source: string | MetadataInput) => {
	if (typeof source !== 'string') return source;
	// Bun's lazy file Blob reports size 0 for a missing path. Preserve I/O errors.
	await stat(source);
	return openAsBlob(source);
};

/** Forward owned Node chunks without Readable.toWeb's per-chunk Buffer copy. */
const toWebStream = (source: Readable): ReadableStream<Uint8Array> => {
	const iterator = source[Symbol.asyncIterator]();
	return new ReadableStream<Uint8Array>({
		async pull(controller) {
			const { done, value } = await iterator.next();
			if (done) controller.close();
			else controller.enqueue(value);
		},
		async cancel() {
			// Destroy first: iterator.return() alone can wait forever on a pending read.
			source.destroy();
			await iterator.return?.();
		}
	});
};

/** Server entry: shared parsing with native Snappy and Node file/stream inputs. */
export class DemoReader extends BaseDemoReader {
	constructor() {
		super(nativeSnappy);
	}

	static async parseHeader(source: string | MetadataInput) {
		return parseHeader(await metadataSource(source), nativeSnappy);
	}

	static async parseServerInfo(source: string | MetadataInput) {
		return parseServerInfo(await metadataSource(source), nativeSnappy);
	}

	static async parseFileInfo(source: string | MetadataInput) {
		return parseFileInfo(await metadataSource(source), nativeSnappy);
	}

	override parseDemo(source: string | DemoInput | Readable, opts: ParseOptions & { stream?: boolean } = {}) {
		this.assertCanParse();
		if (typeof source === 'string') {
			// Keep the chunked path option while sharing the same parsing loop.
			source = createReadStream(source, { highWaterMark: opts.stream === false ? 4 * 1024 * 1024 : 64 * 1024 });
		}
		if (source instanceof Readable) {
			source = toWebStream(source);
		}
		return super.parseDemo(source, opts);
	}
}

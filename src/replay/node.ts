import { openAsBlob } from 'node:fs';
import { stat, type FileHandle } from 'node:fs/promises';
import { blobDemoSource, type DemoByteSource } from './source.js';

/** File slices read on demand. The caller must keep the file unchanged. */
export async function fileDemoSource(path: string): Promise<DemoByteSource> {
	// Bun's openAsBlob can report a missing file as an empty Blob.
	if (!(await stat(path)).isFile()) throw new Error('Expected a regular demo file');
	return blobDemoSource(await openAsBlob(path));
}

/** @internal The path parser owns this handle and closes it after parsing, including pending reads. */
export async function fileHandleDemoSource(file: FileHandle): Promise<DemoByteSource> {
	const info = await file.stat();
	if (!info.isFile()) throw new Error('Expected a regular demo file');
	return {
		size: info.size,
		async read(offset, length, signal) {
			signal?.throwIfAborted();
			const bytes = Buffer.allocUnsafe(length);
			let used = 0;
			while (used < length) {
				// Positional reads also allow a seek to overlap an aborted speculative read.
				const { bytesRead } = await file.read(bytes, used, length - used, offset + used);
				signal?.throwIfAborted();
				if (!bytesRead) throw new Error('Truncated byte source read');
				used += bytesRead;
			}
			return bytes;
		}
	};
}

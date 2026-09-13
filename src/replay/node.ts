import { openAsBlob } from 'node:fs';
import { stat } from 'node:fs/promises';
import { blobDemoSource, type DemoByteSource } from './source.js';

/** File slices read on demand. The caller must keep the file unchanged. */
export async function fileDemoSource(path: string): Promise<DemoByteSource> {
	// Bun's openAsBlob can report a missing file as an empty Blob.
	if (!(await stat(path)).isFile()) throw new Error('Expected a regular demo file');
	return blobDemoSource(await openAsBlob(path));
}

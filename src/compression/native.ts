import snappy from 'snappy';
import type { SnappyDecoder } from './types.js';

const uncompress = (input: Uint8Array, output?: Uint8Array): Uint8Array => {
	const bytes = snappy.uncompressSync(input) as Uint8Array;
	if (!output) return bytes;
	if (output.length < bytes.length) throw new RangeError('Snappy output buffer is too small');
	output.set(bytes);
	return output.subarray(0, bytes.length);
};

export const nativeSnappy: SnappyDecoder = { uncompress, uncompressFrame: uncompress };

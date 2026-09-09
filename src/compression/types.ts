/** @internal Runtime-specific Snappy operations used by the shared parser. */
export interface SnappyDecoder {
	/** Owned output, safe to retain across further decompressions. */
	uncompress(input: Uint8Array, output?: Uint8Array): Uint8Array;
	/** Output may be reused by the next frame or released. Never expose it to listeners. */
	uncompressFrame(input: Uint8Array): Uint8Array;
	/** Drop retained scratch storage, if any. The decoder can be used again afterward. */
	release?(): void;
}

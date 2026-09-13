/** An immutable raw .dem byte source. read must return exactly the requested bytes in storage it will not mutate. */
export interface DemoByteSource {
	readonly size: number;
	read(offset: number, length: number, signal?: AbortSignal): Promise<Uint8Array>;
}

/** Blob/File slices are read on demand; the complete file is never buffered. */
export function blobDemoSource(blob: Blob): DemoByteSource {
	return {
		size: blob.size,
		async read(offset, length, signal) {
			signal?.throwIfAborted();
			const bytes = new Uint8Array(await blob.slice(offset, offset + length).arrayBuffer());
			signal?.throwIfAborted();
			return bytes;
		}
	};
}

/** Requires Content-Length and strict Range support (also exposed by CORS). */
export async function httpDemoSource(url: string, signal?: AbortSignal): Promise<DemoByteSource> {
	const head = await fetch(url, { method: 'HEAD', signal });
	const length = head.headers.get('content-length');
	const size = Number(length);
	if (!head.ok || length === null || !Number.isSafeInteger(size) || size < 16)
		throw new Error('HTTP demo requires valid Content-Length');
	return {
		size,
		async read(offset, length, signal) {
			const response = await fetch(url, {
				signal,
				headers: { Range: `bytes=${offset}-${offset + length - 1}` }
			});
			if (
				response.status !== 206 ||
				response.headers.get('content-range') !== `bytes ${offset}-${offset + length - 1}/${size}`
			) {
				await response.body?.cancel();
				throw new Error('Server did not honor Range');
			}
			// Bound even a misbehaving server's response instead of using arrayBuffer().
			const bytes = new Uint8Array(length);
			const reader = response.body!.getReader();
			let used = 0;
			try {
				while (true) {
					const part = await reader.read();
					if (part.done) break;
					if (used + part.value.length > length) throw new Error('Oversized Range response');
					bytes.set(part.value, used);
					used += part.value.length;
				}
				if (used !== length) throw new Error('Truncated Range response');
				return bytes;
			} finally {
				await reader.cancel();
				reader.releaseLock();
			}
		}
	};
}

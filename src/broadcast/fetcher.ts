import { BroadcastFetchError } from './errors.js';

/**
 * Result of a fragment fetch. `ok: false` is returned for status codes the
 * reader treats as a "retry signal" — currently 404 (fragment not yet ready)
 * and 405 (the reference relay's "please check back soon" response).
 */
export type FetchResult = { ok: true; data: Uint8Array } | { ok: false; status: number };

/**
 * Injection seam for the HTTP layer. Tests use a custom implementation;
 * production uses {@link createDefaultFetcher}.
 */
export interface BroadcastFetcher {
	/** Fetch a JSON document (e.g. `/sync`). Throws BroadcastFetchError on any non-2xx. */
	json<T>(path: string, signal?: AbortSignal): Promise<T>;
	/** Fetch a binary fragment. Returns `{ ok: false, status }` for 404/405; throws BroadcastFetchError otherwise. */
	bytes(path: string, signal?: AbortSignal): Promise<FetchResult>;
}

const STATUS_RETRY = new Set([404, 405]);

/**
 * Default fetcher backed by `globalThis.fetch`. Node 22+ ships undici, which
 * auto-handles `Content-Encoding: gzip` and `deflate`, so no `Accept-Encoding`
 * header is required.
 *
 * @param baseUrl  Base URL for the broadcast. Trailing slash is added if absent.
 * @param init     Optional `RequestInit` merged into every request — useful
 *                 for `Authorization` or other custom headers.
 */
export function createDefaultFetcher(baseUrl: string, init?: RequestInit): BroadcastFetcher {
	const base = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';

	const buildUrl = (path: string): string => {
		// Resolve `path` relative to base. URL handles slash normalization.
		return new URL(path.replace(/^\/+/, ''), base).toString();
	};

	const send = async (path: string, signal?: AbortSignal): Promise<Response> => {
		const url = buildUrl(path);
		return fetch(url, { ...init, signal });
	};

	return {
		async json<T>(path: string, signal?: AbortSignal): Promise<T> {
			const res = await send(path, signal);
			if (!res.ok) {
				throw new BroadcastFetchError(`HTTP ${res.status} for ${path}: ${res.statusText}`, res.status, path);
			}
			return (await res.json()) as T;
		},
		async bytes(path: string, signal?: AbortSignal): Promise<FetchResult> {
			const res = await send(path, signal);
			if (res.ok) {
				const buf = new Uint8Array(await res.arrayBuffer());
				return { ok: true, data: buf };
			}
			if (STATUS_RETRY.has(res.status)) {
				return { ok: false, status: res.status };
			}
			throw new BroadcastFetchError(`HTTP ${res.status} for ${path}: ${res.statusText}`, res.status, path);
		}
	};
}

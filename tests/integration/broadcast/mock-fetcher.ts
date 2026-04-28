import type { BroadcastFetcher, FetchResult } from '../../../src/broadcast/fetcher.js';

export interface MockFetcherSpec {
	sync?: unknown | ((req: { signal?: AbortSignal }) => unknown | Promise<unknown>);
	/** Map of path → response or () => response. Path matches exactly (e.g. "5/full"). */
	bytes?: Record<string, FragmentResponse | (() => FragmentResponse | Promise<FragmentResponse>)>;
	/** Default response for any byte path not explicitly listed. */
	defaultBytes?: FragmentResponse | (() => FragmentResponse | Promise<FragmentResponse>);
}

export type FragmentResponse =
	| { ok: true; data: Uint8Array }
	| { ok: false; status: number }
	| { error: Error };

export class MockBroadcastFetcher implements BroadcastFetcher {
	calls: { path: string; kind: 'json' | 'bytes' }[] = [];
	private readonly spec: MockFetcherSpec;

	constructor(spec: MockFetcherSpec) {
		this.spec = spec;
	}

	async json<T>(path: string, signal?: AbortSignal): Promise<T> {
		this.calls.push({ path, kind: 'json' });
		// Yield to macrotask queue so setTimeout-scheduled cancellations have a
		// chance to fire between fetcher calls.
		await new Promise(r => setTimeout(r, 0));
		this._throwIfAborted(signal);
		const sync = this.spec.sync;
		if (sync === undefined) throw new Error(`mock: no sync configured (called for "${path}")`);
		const value = typeof sync === 'function' ? await sync({ signal }) : sync;
		return value as T;
	}

	async bytes(path: string, signal?: AbortSignal): Promise<FetchResult> {
		this.calls.push({ path, kind: 'bytes' });
		await new Promise(r => setTimeout(r, 0));
		this._throwIfAborted(signal);

		const entry = this.spec.bytes?.[path] ?? this.spec.defaultBytes;
		if (!entry) throw new Error(`mock: no response configured for "${path}"`);

		const resp = typeof entry === 'function' ? await entry() : entry;
		if ('error' in resp) throw resp.error;
		if (resp.ok) return { ok: true, data: resp.data };
		return { ok: false, status: resp.status };
	}

	private _throwIfAborted(signal?: AbortSignal) {
		if (signal?.aborted) {
			const e = new Error('aborted');
			e.name = 'AbortError';
			throw e;
		}
	}
}

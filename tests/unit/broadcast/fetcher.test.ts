import { describe, test, expect, beforeEach, afterEach, mock } from 'bun:test';
import { createDefaultFetcher } from '../../../src/broadcast/fetcher.js';
import { BroadcastFetchError } from '../../../src/broadcast/errors.js';

const originalFetch = globalThis.fetch;

describe('createDefaultFetcher', () => {
	let fetchMock: ReturnType<typeof mock>;

	beforeEach(() => {
		fetchMock = mock(() => new Response('default'));
		globalThis.fetch = fetchMock as unknown as typeof fetch;
	});

	afterEach(() => {
		globalThis.fetch = originalFetch;
	});

	test('json: parses 2xx body', async () => {
		fetchMock.mockImplementationOnce(() =>
			Promise.resolve(new Response(JSON.stringify({ hello: 'world' }), { status: 200 }))
		);
		const fetcher = createDefaultFetcher('https://example.com/');
		const result = await fetcher.json<{ hello: string }>('sync');
		expect(result).toEqual({ hello: 'world' });
	});

	test('json: throws BroadcastFetchError on non-2xx', async () => {
		fetchMock.mockImplementationOnce(() => Promise.resolve(new Response('', { status: 500 })));
		const fetcher = createDefaultFetcher('https://example.com/');
		await expect(fetcher.json('sync')).rejects.toBeInstanceOf(BroadcastFetchError);
	});

	test('bytes: returns Uint8Array on 200', async () => {
		fetchMock.mockImplementationOnce(() =>
			Promise.resolve(new Response(new Uint8Array([1, 2, 3]), { status: 200 }))
		);
		const fetcher = createDefaultFetcher('https://example.com/');
		const result = await fetcher.bytes('frag/0/full');
		expect(result.ok).toBe(true);
		if (result.ok) expect(Array.from(result.data)).toEqual([1, 2, 3]);
	});

	test('bytes: returns ok:false with status on 404', async () => {
		fetchMock.mockImplementationOnce(() => Promise.resolve(new Response('', { status: 404 })));
		const fetcher = createDefaultFetcher('https://example.com/');
		const result = await fetcher.bytes('frag/0/delta');
		expect(result).toEqual({ ok: false, status: 404 });
	});

	test('bytes: returns ok:false with status on 405', async () => {
		fetchMock.mockImplementationOnce(() => Promise.resolve(new Response('', { status: 405 })));
		const fetcher = createDefaultFetcher('https://example.com/');
		const result = await fetcher.bytes('frag/0/delta');
		expect(result).toEqual({ ok: false, status: 405 });
	});

	test('bytes: throws BroadcastFetchError on 500', async () => {
		fetchMock.mockImplementationOnce(() => Promise.resolve(new Response('', { status: 500 })));
		const fetcher = createDefaultFetcher('https://example.com/');
		await expect(fetcher.bytes('frag/0/delta')).rejects.toBeInstanceOf(BroadcastFetchError);
	});

	test('forwards AbortSignal to fetch', async () => {
		fetchMock.mockImplementationOnce((_url: string, init?: RequestInit) => {
			expect(init?.signal).toBeInstanceOf(AbortSignal);
			return Promise.resolve(new Response('', { status: 200 }));
		});
		const fetcher = createDefaultFetcher('https://example.com/');
		const ctrl = new AbortController();
		await fetcher.bytes('frag/0/full', ctrl.signal);
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	test('appends trailing slash to baseUrl when missing', async () => {
		let capturedUrl = '';
		fetchMock.mockImplementationOnce((url: string) => {
			capturedUrl = url;
			return Promise.resolve(new Response('', { status: 200 }));
		});
		const fetcher = createDefaultFetcher('https://example.com/path');
		await fetcher.bytes('5/full');
		expect(capturedUrl).toBe('https://example.com/path/5/full');
	});

	test('forwards init headers', async () => {
		let capturedInit: RequestInit | undefined;
		fetchMock.mockImplementationOnce((_url: string, init?: RequestInit) => {
			capturedInit = init;
			return Promise.resolve(new Response('', { status: 200 }));
		});
		const fetcher = createDefaultFetcher('https://example.com/', {
			headers: { Authorization: 'Bearer abc' }
		});
		await fetcher.bytes('5/full');
		expect((capturedInit?.headers as Record<string, string>).Authorization).toBe('Bearer abc');
	});
});

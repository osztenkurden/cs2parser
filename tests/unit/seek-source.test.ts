import { expect, test } from 'bun:test';
import { httpDemoSource } from '../../src/index.js';

test('HTTP requires validated partial responses, never silently downloads a full demo', async () => {
	const original = globalThis.fetch;
	try {
		globalThis.fetch = (async (_url, init) =>
			init?.method === 'HEAD'
				? new Response(null, { headers: { 'content-length': '100' } })
				: new Response(new Uint8Array(100))) as typeof fetch;
		const source = await httpDemoSource('https://example.test/demo');
		await expect(source.read(0, 16)).rejects.toThrow('Range');
		globalThis.fetch = (async (_url, init) => {
			expect(new Headers(init?.headers).get('if-match')).toBeNull();
			expect(init?.cache).toBeUndefined();
			return new Response(new Uint8Array(16), {
				status: 206,
				headers: { 'content-range': 'bytes 0-15/100' }
			});
		}) as typeof fetch;
		expect((await source.read(0, 16)).length).toBe(16);
	} finally {
		globalThis.fetch = original;
	}
});

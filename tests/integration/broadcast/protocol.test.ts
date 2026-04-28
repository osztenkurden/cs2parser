import { describe, test, expect } from 'bun:test';
import { DemoReader } from '../../../src/index.js';
import { HttpBroadcastReader } from '../../../src/broadcast/index.js';
import { EDemoCommands } from '../../../src/ts-proto/demo.js';
import { buildFragment } from '../../unit/broadcast/helpers.js';
import { MockBroadcastFetcher, type FragmentResponse } from './mock-fetcher.js';

const baseSync = {
	tick: 100,
	rtdelay: 1,
	rcvage: 0,
	fragment: 5,
	signup_fragment: 0,
	tps: 64,
	protocol: 5
};

function syncFrag(tick: number): Uint8Array {
	return buildFragment([{ cmd: EDemoCommands.DEM_SyncTick, tick, payload: new Uint8Array(0) }]);
}

function endFrag(): Uint8Array {
	return buildFragment([], true);
}

function ok(data: Uint8Array): FragmentResponse {
	return { ok: true, data };
}
function notFound(): FragmentResponse {
	return { ok: false, status: 404 };
}

describe('HttpBroadcastReader (protocol shape)', () => {
	test('happy path: sync → signup → full → delta → delta → end-marker', async () => {
		const fetcher = new MockBroadcastFetcher({
			sync: baseSync,
			bytes: {
				'0/start': ok(syncFrag(0)),
				'5/full': ok(syncFrag(100)),
				'6/delta': ok(syncFrag(110)),
				'7/delta': ok(endFrag())
			}
		});

		const parser = new DemoReader();
		const syncEvents: unknown[] = [];
		parser.on('broadcastsync', s => syncEvents.push(s));
		const reader = new HttpBroadcastReader(parser, 'https://example.com/', {
			fetcher,
			deltaThrottle: 0,
			deltaRetryInterval: 0
		});

		await reader.start();
		const terminus = await reader.run();

		expect(terminus.reason).toBe('stop');
		expect(syncEvents.length).toBe(1);
		expect(reader.sync?.protocol).toBe(5);
		expect(fetcher.calls.map(c => c.path)).toEqual(['sync', '0/start', '5/full', '6/delta', '7/delta']);
	});

	test('protocol mismatch throws BroadcastProtocolError', async () => {
		const fetcher = new MockBroadcastFetcher({
			sync: { ...baseSync, protocol: 4 }
		});
		const parser = new DemoReader();
		const reader = new HttpBroadcastReader(parser, 'https://example.com/', { fetcher });
		await expect(reader.start()).rejects.toThrow(/protocol 4/);
	});

	test('/delta 404 retries up to maxDeltaRetries then ends with reason "timeout"', async () => {
		const fetcher = new MockBroadcastFetcher({
			sync: baseSync,
			bytes: {
				'0/start': ok(syncFrag(0)),
				'5/full': ok(syncFrag(100))
			},
			defaultBytes: notFound()
		});

		const parser = new DemoReader();
		const reader = new HttpBroadcastReader(parser, 'https://example.com/', {
			fetcher,
			maxDeltaRetries: 2,
			deltaRetryInterval: 1,
			deltaThrottle: 0
		});

		await reader.start();
		const terminus = await reader.run();
		expect(terminus.reason).toBe('timeout');
	});

	test('/delta 404 retries succeed eventually', async () => {
		let attempts = 0;
		const fetcher = new MockBroadcastFetcher({
			sync: baseSync,
			bytes: {
				'0/start': ok(syncFrag(0)),
				'5/full': ok(syncFrag(100)),
				'6/delta': () => {
					attempts++;
					if (attempts < 3) return notFound();
					return ok(endFrag());
				}
			}
		});
		const parser = new DemoReader();
		const reader = new HttpBroadcastReader(parser, 'https://example.com/', {
			fetcher,
			maxDeltaRetries: 5,
			deltaRetryInterval: 1,
			deltaThrottle: 0
		});

		await reader.start();
		const terminus = await reader.run();
		expect(terminus.reason).toBe('stop');
		expect(attempts).toBe(3);
	});

	test('/full 404 exhaustion ends with reason "error"', async () => {
		const fetcher = new MockBroadcastFetcher({
			sync: baseSync,
			bytes: {
				'0/start': ok(syncFrag(0))
			},
			defaultBytes: notFound()
		});

		const parser = new DemoReader();
		const reader = new HttpBroadcastReader(parser, 'https://example.com/', {
			fetcher,
			maxFullRetries: 1,
			deltaRetryInterval: 1
		});

		await reader.start();
		// Note: start() does NOT throw — terminal state is captured on the reader.
		expect(reader.sync).not.toBeNull(); // sync did succeed
		// run() should resolve with 'error' or be already terminated.
		const terminus = await reader.run();
		expect(terminus.reason).toBe('error');
	});

	test('reader.stop() cancels mid-stream → reason "cancelled"', async () => {
		let deltaCount = 0;
		const fetcher = new MockBroadcastFetcher({
			sync: baseSync,
			bytes: {
				'0/start': ok(syncFrag(0)),
				'5/full': ok(syncFrag(100))
			},
			defaultBytes: () => {
				deltaCount++;
				return ok(syncFrag(100 + deltaCount));
			}
		});

		const parser = new DemoReader();
		const reader = new HttpBroadcastReader(parser, 'https://example.com/', {
			fetcher,
			deltaThrottle: 0
		});

		await reader.start();
		// Stop after a couple of deltas
		setTimeout(() => reader.stop(), 5);
		const terminus = await reader.run();
		expect(terminus.reason).toBe('cancelled');
	});

	test('opts.signal abort cancels the run', async () => {
		const ctrl = new AbortController();
		const fetcher = new MockBroadcastFetcher({
			sync: baseSync,
			bytes: {
				'0/start': ok(syncFrag(0)),
				'5/full': ok(syncFrag(100))
			},
			defaultBytes: () => {
				return ok(syncFrag(150));
			}
		});

		const parser = new DemoReader();
		const reader = new HttpBroadcastReader(parser, 'https://example.com/', {
			fetcher,
			signal: ctrl.signal,
			deltaThrottle: 0
		});

		await reader.start();
		setTimeout(() => ctrl.abort(), 5);
		const terminus = await reader.run();
		expect(terminus.reason).toBe('cancelled');
	});

	test('parser.cancel() during start propagates as cancellation', async () => {
		const parser = new DemoReader();
		const fetcher = new MockBroadcastFetcher({
			sync: () => {
				// Delay so we can call cancel mid-flight.
				return new Promise(resolve => setTimeout(() => resolve(baseSync), 20));
			},
			bytes: {}
		});
		const reader = new HttpBroadcastReader(parser, 'https://example.com/', { fetcher });
		setTimeout(() => parser.cancel(), 5);
		await reader.start(); // resolves with terminus = cancelled
		// Immediately running run() should resolve with 'cancelled' since terminus is set
		const terminus = await reader.run();
		expect(terminus.reason).toBe('cancelled');
	});

	test('emits broadcastsync event with the validated DTO', async () => {
		const fetcher = new MockBroadcastFetcher({
			sync: { ...baseSync, map: 'de_mirage', endtick: 200 },
			bytes: {
				'0/start': ok(syncFrag(0)),
				'5/full': ok(endFrag())
			}
		});

		const parser = new DemoReader();
		let received: any = null;
		parser.on('broadcastsync', s => {
			received = s;
		});

		const reader = new HttpBroadcastReader(parser, 'https://example.com/', {
			fetcher,
			deltaThrottle: 0
		});
		await reader.start();
		await reader.run();

		expect(received).not.toBeNull();
		expect(received.protocol).toBe(5);
		expect(received.map).toBe('de_mirage');
		expect(received.endtick).toBe(200);
	});

	test('token_redirect modifies fragment URLs', async () => {
		const fetcher = new MockBroadcastFetcher({
			sync: { ...baseSync, token_redirect: 'match-1/' },
			bytes: {
				'match-1/0/start': ok(syncFrag(0)),
				'match-1/5/full': ok(endFrag())
			}
		});
		const parser = new DemoReader();
		const reader = new HttpBroadcastReader(parser, 'https://example.com/', {
			fetcher,
			deltaThrottle: 0
		});
		await reader.start();
		await reader.run();
		expect(fetcher.calls.map(c => c.path)).toContain('match-1/0/start');
		expect(fetcher.calls.map(c => c.path)).toContain('match-1/5/full');
	});

	test('parseHttpBroadcast convenience method runs to completion', async () => {
		const fetcher = new MockBroadcastFetcher({
			sync: baseSync,
			bytes: {
				'0/start': ok(syncFrag(0)),
				'5/full': ok(syncFrag(100)),
				'6/delta': ok(endFrag())
			}
		});
		const parser = new DemoReader();
		await parser.parseHttpBroadcast('https://example.com/', { fetcher, deltaThrottle: 0 });
		expect(parser.currentTick).toBeGreaterThanOrEqual(100);
	});

	test('onFragmentError "abort" terminates with reason "error"', async () => {
		// Mark a DEM_Packet fragment as snappy-compressed but provide invalid snappy bytes.
		// DEM_Packet flows through baseParse → decompressIfNeeded; snappy.uncompressSync
		// reliably throws "corrupt input (invalid header)" for this case.
		const garbagePayload = new Uint8Array([0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff]);
		const corruptFrag = buildFragment([
			{ cmd: EDemoCommands.DEM_Packet, tick: 100, payload: garbagePayload, isCompressed: true }
		]);

		const fetcher = new MockBroadcastFetcher({
			sync: baseSync,
			bytes: {
				'0/start': ok(syncFrag(0)),
				'5/full': ok(corruptFrag)
			},
			defaultBytes: notFound()
		});

		const errors: Error[] = [];
		const parser = new DemoReader();
		const reader = new HttpBroadcastReader(parser, 'https://example.com/', {
			fetcher,
			deltaThrottle: 0,
			onFragmentError: err => {
				errors.push(err);
				return 'abort';
			}
		});

		await reader.start();
		const terminus = await reader.run();
		expect(terminus.reason).toBe('error');
		expect(errors.length).toBeGreaterThan(0);
	});
});

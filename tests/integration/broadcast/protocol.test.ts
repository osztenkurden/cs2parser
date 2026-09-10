import { describe, test, expect, spyOn } from 'bun:test';
import snappy from 'snappy';
import { DemoReader } from '../../../src/index.js';
import { DemoReader as BrowserReader } from '../../../src/browser.js';
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

describe('broadcast lifecycle safety', () => {
	test('invalid session options leave the parser available', async () => {
		const parser = new DemoReader();
		const fetcher = new MockBroadcastFetcher({ sync: baseSync });
		const reader = new HttpBroadcastReader(parser, 'https://unused.invalid/', {
			fetcher,
			decryptionKey: new Uint8Array(1)
		});
		await expect(reader.start()).rejects.toThrow('exactly 16 bytes');
		expect(fetcher.calls).toHaveLength(0);
		expect(parser.hasEnded).toBe(false);
		expect(await parser.parseDemo(new Uint8Array(0))).toEqual({ incomplete: true });
	});

	test('run rejects while start is pending without issuing delta requests', async () => {
		const parser = new DemoReader();
		const fetcher = new MockBroadcastFetcher({ sync: baseSync });
		const reader = new HttpBroadcastReader(parser, 'https://unused.invalid/', { fetcher });
		const pending = reader.start();
		await expect(reader.run()).rejects.toThrow('must be awaited');
		expect(fetcher.calls.map(c => c.path)).toEqual(['sync']);
		reader.stop();
		await pending;
		expect(await reader.run()).toEqual({ reason: 'cancelled' });
	});

	test.each(['stop', 'cancel', 'signal'] as const)('%s after start ends without run', async action => {
		const parser = new DemoReader();
		const signal = new AbortController();
		const ticksBefore = parser.listenerCount('tickstart');
		let ends = 0;
		let releases = 0;
		parser._snappy.release = () => {
			releases++;
		};
		parser.on('end', () => {
			ends++;
		});
		const fetcher = new MockBroadcastFetcher({
			sync: baseSync,
			defaultBytes: ok(new Uint8Array(0))
		});
		const reader = new HttpBroadcastReader(parser, 'https://unused.invalid/', { fetcher, signal: signal.signal });
		await reader.start();
		if (action === 'stop') reader.stop();
		else if (action === 'cancel') parser.cancel();
		else signal.abort();
		expect(parser.hasEnded).toBe(true);
		expect(ends).toBe(1);
		expect(releases).toBe(1);
		expect(parser.listenerCount('tickstart')).toBe(ticksBefore);
		expect(await reader.run()).toEqual({ reason: 'cancelled' });
		reader.stop();
		expect(ends).toBe(1);
	});

	test.each(['broadcastsync', 'gameeventlist', 'tickstart', 'end', 'onFragmentError'] as const)(
		'%s exceptions reject startup and unhook listeners',
		async event => {
			const parser = new DemoReader();
			const failure = new Error(event);
			const signal = new AbortController();
			const removeAbortListener = spyOn(signal.signal, 'removeEventListener');
			let calls = 0;
			let fragmentErrors = 0;
			let releases = 0;
			parser._snappy.release = () => {
				releases++;
			};
			if (event !== 'onFragmentError')
				parser.on(event, () => {
					calls++;
					throw failure;
				});
			if (event !== 'end')
				parser.on('end', () => {
					throw new Error('secondary end listener');
				});
			const ticksBefore = parser.listenerCount('tickstart');
			const fetcher = new MockBroadcastFetcher({
				sync: baseSync,
				bytes: {
					'0/start': ok(event === 'onFragmentError' ? Uint8Array.of(1) : syncFrag(1)),
					'5/full': ok(endFrag())
				}
			});
			const reader = new HttpBroadcastReader(parser, 'https://unused.invalid/', {
				fetcher,
				signal: signal.signal,
				onFragmentError() {
					fragmentErrors++;
					if (event === 'onFragmentError') throw failure;
					return 'continue';
				}
			});
			await expect(reader.start()).rejects.toBe(failure);
			expect(parser.hasEnded).toBe(true);
			expect(releases).toBe(1);
			expect(calls).toBe(event === 'onFragmentError' ? 0 : 1);
			expect(fragmentErrors).toBe(event === 'onFragmentError' ? 1 : 0);
			expect(parser.listenerCount('tickstart')).toBe(ticksBefore);
			expect(removeAbortListener).toHaveBeenCalledTimes(1);
			removeAbortListener.mockRestore();
			reader.stop();
		}
	);

	test('idle stop cleans up even if the end listener throws', async () => {
		const parser = new DemoReader();
		const failure = new Error('end');
		const ticksBefore = parser.listenerCount('tickstart');
		parser.prependListener('end', () => {
			throw failure;
		});
		const reader = new HttpBroadcastReader(parser, 'https://unused.invalid/', {
			fetcher: new MockBroadcastFetcher({ sync: baseSync, defaultBytes: ok(new Uint8Array(0)) })
		});
		await reader.start();
		expect(() => reader.stop()).toThrow(failure);
		expect(parser.hasEnded).toBe(true);
		expect(parser.listenerCount('tickstart')).toBe(ticksBefore);
		reader.stop();
		expect(await reader.run()).toEqual({ reason: 'cancelled' });
	});

	test.each(['tickstart', 'end', 'onFragmentError'] as const)('%s exceptions reject an active run', async event => {
		const parser = new DemoReader();
		const failure = new Error(event);
		const fetcher = new MockBroadcastFetcher({
			sync: baseSync,
			defaultBytes: ok(new Uint8Array(0)),
			bytes: {
				'6/delta': ok(
					event === 'onFragmentError' ? Uint8Array.of(1) : event === 'end' ? endFrag() : syncFrag(110)
				)
			}
		});
		const reader = new HttpBroadcastReader(parser, 'https://unused.invalid/', {
			fetcher,
			deltaThrottle: 0,
			onFragmentError() {
				throw failure;
			}
		});
		await reader.start();
		if (event !== 'onFragmentError')
			parser.on(event, () => {
				throw failure;
			});
		const ticksBefore = parser.listenerCount('tickstart');
		await expect(reader.run()).rejects.toBe(failure);
		expect(parser.hasEnded).toBe(true);
		expect(parser.listenerCount('tickstart')).toBe(ticksBefore - 1);
	});

	test('sync rejection preserves the fetch error when an end listener also throws', async () => {
		const parser = new DemoReader();
		const failure = new Error('sync fetch');
		let endError: unknown;
		parser.on('end', result => {
			endError = result.error;
			throw new Error('secondary');
		});
		const ticksBefore = parser.listenerCount('tickstart');
		const reader = new HttpBroadcastReader(parser, 'https://unused.invalid/', {
			fetcher: new MockBroadcastFetcher({
				sync() {
					throw failure;
				}
			})
		});
		await expect(reader.start()).rejects.toBe(failure);
		expect(endError).toBe(failure);
		expect(parser.listenerCount('tickstart')).toBe(ticksBefore);
	});

	test.each(['0/start', '5/full'] as const)(
		'%s fetch failures still resolve start and run with an error terminus',
		async path => {
			const failure = new Error(path);
			const reader = new HttpBroadcastReader(new DemoReader(), 'https://unused.invalid/', {
				fetcher: new MockBroadcastFetcher({
					sync: baseSync,
					defaultBytes: ok(new Uint8Array(0)),
					bytes: { [path]: { error: failure } }
				})
			});
			await reader.start();
			expect(await reader.run()).toEqual({ reason: 'error', error: failure });
		}
	);

	test('throwing parser cancel listeners cannot prevent pending fetch cancellation', async () => {
		const parser = new DemoReader();
		const failure = new Error('cancel');
		parser.on('cancel', () => {
			throw failure;
		});
		let entered!: () => void;
		const fetching = new Promise<void>(resolve => {
			entered = resolve;
		});
		let aborted = false;
		const ticksBefore = parser.listenerCount('tickstart');
		const reader = new HttpBroadcastReader(parser, 'https://unused.invalid/', {
			fetcher: new MockBroadcastFetcher({
				sync: ({ signal }: { signal?: AbortSignal }) =>
					new Promise((_, reject) => {
						signal!.addEventListener(
							'abort',
							() => {
								aborted = true;
								reject(new Error('custom abort error'));
							},
							{ once: true }
						);
						entered();
					})
			})
		});
		const pending = reader.start();
		await fetching;
		expect(() => parser.cancel()).toThrow(failure);
		await expect(pending).rejects.toBe(failure);
		expect(aborted).toBe(true);
		expect(parser.hasEnded).toBe(true);
		expect(parser.listenerCount('tickstart')).toBe(ticksBefore);
	});
});

describe('HttpBroadcastReader (protocol shape)', () => {
	test('happy path: sync → signup → full → delta → delta → end-marker', async () => {
		const fetcher = new MockBroadcastFetcher({
			sync: baseSync,
			bytes: {
				'0/start': ok(syncFrag(0)),
				'5/full': ok(syncFrag(100)),
				'5/delta': ok(syncFrag(105)),
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
		expect(fetcher.calls.map(c => c.path)).toEqual(['sync', '0/start', '5/full', '5/delta', '6/delta', '7/delta']);
	});

	test("fetches the starting fragment's own /delta, not just its keyframe", async () => {
		// {N}/full is a keyframe at fragment N's first tick and {N}/delta carries that
		// fragment's ticks, so jumping to {N+1}/delta would skip a whole keyframe interval.
		const fetcher = new MockBroadcastFetcher({
			sync: baseSync,
			bytes: {
				'0/start': ok(syncFrag(0)),
				'5/full': ok(syncFrag(100)),
				'5/delta': ok(syncFrag(105)),
				'6/delta': ok(endFrag())
			}
		});
		const parser = new DemoReader();
		const ticks: number[] = [];
		parser.on('tickstart', t => ticks.push(t));
		const reader = new HttpBroadcastReader(parser, 'https://example.com/', { fetcher, deltaThrottle: 0 });

		await reader.start();
		expect(fetcher.calls.map(c => c.path)).toEqual(['sync', '0/start', '5/full', '5/delta']);
		expect(ticks).toContain(105);

		await reader.run();
		expect(fetcher.calls.map(c => c.path)).toContain('6/delta');
	});

	test('a relay without {N}/delta still connects, with a debug note', async () => {
		const fetcher = new MockBroadcastFetcher({
			sync: baseSync,
			bytes: {
				'0/start': ok(syncFrag(0)),
				'5/full': ok(syncFrag(100)),
				'5/delta': notFound(),
				'6/delta': ok(endFrag())
			}
		});
		const parser = new DemoReader();
		const debugs: string[] = [];
		parser.on('debug', m => debugs.push(String(m)));
		const reader = new HttpBroadcastReader(parser, 'https://example.com/', { fetcher, deltaThrottle: 0 });

		await reader.start();
		const terminus = await reader.run();

		// One attempt only — no retry storm on a relay that simply doesn't serve it.
		expect(fetcher.calls.filter(c => c.path === '5/delta').length).toBe(1);
		expect(terminus.reason).toBe('stop');
		expect(debugs.some(d => d.includes('5/delta unavailable'))).toBe(true);
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
				'5/delta': ok(syncFrag(105)),
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
		// Block the sync fetch on an explicit promise so the cancel ordering is
		// deterministic — no setTimeout race between cancel and sync resolution.
		let resolveSync!: (v: typeof baseSync) => void;
		const syncPromise = new Promise<typeof baseSync>(r => {
			resolveSync = r;
		});
		const fetcher = new MockBroadcastFetcher({
			sync: () => syncPromise,
			bytes: {}
		});
		const reader = new HttpBroadcastReader(parser, 'https://example.com/', { fetcher });
		const startPromise = reader.start();
		parser.cancel();
		resolveSync(baseSync);
		await startPromise; // resolves with terminus = cancelled
		// Immediately running run() should resolve with 'cancelled' since terminus is set
		const terminus = await reader.run();
		expect(terminus.reason).toBe('cancelled');
	});

	test('broadcast cancellation stops later commands from recreating decoder storage', async () => {
		const reader = new BrowserReader();
		let decodes = 0;
		let releases = 0;
		const decode = reader._snappy.uncompressFrame.bind(reader._snappy);
		const release = reader._snappy.release!.bind(reader._snappy);
		reader._snappy.uncompressFrame = bytes => {
			expect(releases).toBe(0);
			decodes++;
			return decode(bytes);
		};
		reader._snappy.release = () => {
			releases++;
			release();
		};
		reader.on('tickstart', tick => {
			if (tick === 100) reader.cancel();
		});
		const ends: { reason?: string }[] = [];
		reader.on('end', end => ends.push(end));
		const compressed = snappy.compressSync(new Uint8Array(0));
		const fragment = buildFragment(
			[100, 101].map(tick => ({
				cmd: EDemoCommands.DEM_Packet,
				tick,
				payload: compressed,
				isCompressed: true
			}))
		);
		const fetcher = new MockBroadcastFetcher({
			sync: { ...baseSync, rtdelay: 0 },
			bytes: { '0/start': ok(new Uint8Array(0)), '5/full': ok(fragment), '5/delta': ok(endFrag()) }
		});
		await reader.parseHttpBroadcast('https://unused.invalid/', { fetcher });
		expect(decodes).toBe(1);
		expect(releases).toBe(1);
		expect(ends).toHaveLength(1);
		expect(ends[0]!.reason).toBe('cancelled');
		expect(reader.currentTick).toBe(100);
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
				'5/delta': ok(syncFrag(105)),
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

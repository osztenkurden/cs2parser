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
	test.each(['0/start', '5/full'])('cancellation after accepting %s bytes skips processing', async target => {
		const parser = new DemoReader();
		const ticksBefore = parser.listenerCount('tickstart');
		const ends: unknown[] = [];
		const errors: unknown[] = [];
		const calls: string[] = [];
		let releases = 0;
		parser._snappy.release = () => {
			releases++;
		};
		parser.on('end', end => ends.push(end));
		parser.on('error', error => errors.push(error));
		const reader = new HttpBroadcastReader(parser, 'https://unused.invalid/', {
			fetcher: {
				async json<T>() {
					return baseSync as T;
				},
				async bytes(path) {
					calls.push(path);
					if (path === target) queueMicrotask(() => queueMicrotask(() => parser.cancel()));
					return { ok: true, data: syncFrag(100) };
				}
			}
		});
		expect(await reader.start()).toEqual({ status: 'cancelled' });
		expect(parser.hasEnded).toBe(true);
		expect(ends).toEqual([{ status: 'cancelled' }]);
		expect(errors).toEqual([]);
		expect(releases).toBe(1);
		expect(parser.listenerCount('tickstart')).toBe(ticksBefore);
		expect(calls).toEqual(target === '0/start' ? ['0/start'] : ['0/start', '5/full']);
		expect(await reader.run()).toEqual({ status: 'cancelled' });
		expect(ends).toHaveLength(1);
		expect(releases).toBe(1);
	});

	test('cancellation after the full-fragment callback prevents the initial delta fetch', async () => {
		const parser = new DemoReader();
		parser.on('tickstart', () => queueMicrotask(() => parser.cancel()));
		const fetcher = new MockBroadcastFetcher({
			sync: baseSync,
			bytes: { '0/start': ok(new Uint8Array()), '5/full': ok(syncFrag(100)) }
		});
		const reader = new HttpBroadcastReader(parser, 'https://unused.invalid/', { fetcher });
		expect(await reader.start()).toEqual({ status: 'cancelled' });
		expect(await reader.run()).toEqual({ status: 'cancelled' });
		expect(fetcher.calls.map(call => call.path)).toEqual(['sync', '0/start', '5/full']);
	});

	for (const callback of ['unavailable delta diagnostic', 'skipped fragment diagnostic', 'onFragmentError']) {
		test.each(['stop', 'signal', 'cancel'] as const)(
			`${callback}: %s finalizes startup before returning`,
			async action => {
				const parser = new DemoReader();
				const signal = new AbortController();
				const ticksBefore = parser.listenerCount('tickstart');
				const ends: unknown[] = [];
				const errors: unknown[] = [];
				let releases = 0;
				let cancellations = 0;
				parser._snappy.release = () => {
					releases++;
				};
				parser.on('end', end => ends.push(end));
				parser.on('error', error => errors.push(error));
				const cancel = () => {
					cancellations++;
					if (action === 'stop') reader.stop();
					else if (action === 'signal') signal.abort();
					else parser.cancel();
				};
				const fetcher = new MockBroadcastFetcher({
					sync: baseSync,
					defaultBytes: ok(new Uint8Array()),
					bytes: {
						'5/delta': callback === 'unavailable delta diagnostic' ? notFound() : ok(Uint8Array.of(1))
					}
				});
				const reader = new HttpBroadcastReader(parser, 'https://unused.invalid/', {
					fetcher,
					signal: signal.signal,
					onFragmentError() {
						if (callback === 'onFragmentError') cancel();
						return 'continue';
					}
				});
				parser.on('debug', message => {
					if (
						(callback === 'unavailable delta diagnostic' && message.includes('5/delta unavailable')) ||
						(callback === 'skipped fragment diagnostic' && message.includes('skipped delta fragment'))
					)
						cancel();
				});
				expect(await reader.start()).toEqual({ status: 'cancelled' });
				expect(cancellations).toBe(1);
				expect(parser.hasEnded).toBe(true);
				expect(ends).toEqual([{ status: 'cancelled' }]);
				expect(errors).toEqual([]);
				expect(releases).toBe(1);
				expect(parser.listenerCount('tickstart')).toBe(ticksBefore);
				expect(await reader.run()).toEqual({ status: 'cancelled' });
				expect(fetcher.calls.map(call => call.path)).toEqual(['sync', '0/start', '5/full', '5/delta']);
				expect(ends).toHaveLength(1);
				expect(releases).toBe(1);
			}
		);
	}

	test.each(['0/start', '5/full', '5/delta'])('an end marker in %s completes startup without run', async path => {
		const parser = new DemoReader();
		const signal = new AbortController();
		const ticksBefore = parser.listenerCount('tickstart');
		const remove = spyOn(signal.signal, 'removeEventListener');
		parser.on('end', end => {
			expect(end).toEqual({ status: 'complete' });
			expect(parser.hasEnded).toBe(true);
			expect(parser.listenerCount('tickstart')).toBe(ticksBefore);
			expect(remove).toHaveBeenCalledTimes(1);
		});
		const fetcher = new MockBroadcastFetcher({
			sync: baseSync,
			defaultBytes: ok(new Uint8Array()),
			bytes: { [path]: ok(endFrag()) }
		});
		const reader = new HttpBroadcastReader(parser, 'https://unused.invalid/', { fetcher, signal: signal.signal });
		expect(await reader.start()).toEqual({ status: 'complete' });
		expect(fetcher.calls.at(-1)?.path).toBe(path);
		reader.stop();
		remove.mockRestore();
	});

	test.each(['stop', 'signal'])('%s before start explicitly cancels without I/O', async action => {
		const parser = new DemoReader();
		const signal = new AbortController();
		const fetcher = new MockBroadcastFetcher({ sync: baseSync });
		const reader = new HttpBroadcastReader(parser, 'https://unused.invalid/', { fetcher, signal: signal.signal });
		if (action === 'stop') reader.stop();
		else signal.abort();
		expect(await reader.start()).toEqual({ status: 'cancelled' });
		expect(fetcher.calls).toHaveLength(0);
		expect(parser.hasEnded).toBe(true);
	});

	test.each(['deltaThrottle', 'deltaRetryInterval', 'maxDeltaRetries', 'maxFullRetries'])(
		'invalid %s does not reserve the parser',
		async key => {
			const parser = new DemoReader();
			const reader = new HttpBroadcastReader(parser, 'https://unused.invalid/', { [key]: -1 });
			await expect(reader.start()).rejects.toBeInstanceOf(RangeError);
			expect(await parser.parseDemo(new Uint8Array())).toEqual({ status: 'incomplete' });
		}
	);

	test('ready, invalid lifecycle calls, and run fetch failures use promises', async () => {
		const failure = new Error('delta fetch');
		const reader = new HttpBroadcastReader(new DemoReader(), 'https://unused.invalid/', {
			fetcher: new MockBroadcastFetcher({
				sync: baseSync,
				defaultBytes: ok(new Uint8Array()),
				bytes: { '6/delta': { error: failure } }
			})
		});
		await expect(reader.run()).rejects.toThrow('must be awaited');
		expect(await reader.start()).toEqual({ status: 'ready' });
		await expect(reader.start()).rejects.toThrow('already called');
		await expect(reader.run()).rejects.toBe(failure);
		reader.stop();
	});

	test('an unsolicited AbortError is a failure, not cancellation', async () => {
		const failure = new DOMException('transport aborted', 'AbortError');
		const reader = new HttpBroadcastReader(new DemoReader(), 'https://unused.invalid/', {
			fetcher: new MockBroadcastFetcher({
				sync() {
					throw failure;
				}
			})
		});
		await expect(reader.start()).rejects.toBe(failure);
	});

	test('pending run cancellation preserves a thrown value and rejects a concurrent run', async () => {
		const parser = new DemoReader();
		const failure = { message: 'cancel listener' };
		parser.on('cancel', () => {
			throw failure;
		});
		let entered!: () => void;
		const fetching = new Promise<void>(resolve => {
			entered = resolve;
		});
		const reader = new HttpBroadcastReader(parser, 'https://unused.invalid/', {
			fetcher: new MockBroadcastFetcher({
				sync: baseSync,
				defaultBytes: ok(new Uint8Array()),
				bytes: {
					'6/delta': ({ signal }) =>
						new Promise((_, reject) => {
							signal!.addEventListener('abort', () => reject(new Error('fetch aborted')), { once: true });
							entered();
						})
				}
			})
		});
		expect(await reader.start()).toEqual({ status: 'ready' });
		const pending = reader.run();
		await fetching;
		await expect(reader.run()).rejects.toThrow('already in progress');
		try {
			parser.cancel();
		} catch (cause) {
			expect(cause).toBe(failure);
		}
		await expect(pending).rejects.toBe(failure);
		expect(parser.hasEnded).toBe(true);
	});

	test('fragment continue discards undelivered events without replaying them', async () => {
		const parser = new DemoReader();
		const ticks: number[] = [];
		parser.on('tickstart', tick => ticks.push(tick));
		const corrupt = buildFragment([
			{ cmd: EDemoCommands.DEM_Packet, tick: 200, payload: Uint8Array.of(255), isCompressed: true }
		]);
		let failures = 0;
		const reader = new HttpBroadcastReader(parser, 'https://unused.invalid/', {
			fetcher: new MockBroadcastFetcher({
				sync: baseSync,
				defaultBytes: ok(new Uint8Array()),
				bytes: { '5/full': ok(corrupt), '6/delta': ok(endFrag()) }
			}),
			onFragmentError() {
				failures++;
				return 'continue';
			}
		});
		expect(await reader.start()).toEqual({ status: 'ready' });
		expect(await reader.run()).toEqual({ status: 'complete' });
		expect(failures).toBe(1);
		expect(ticks).toEqual([]);
	});

	test.each(['complete', 'cancelled', 'timeout'] as const)('convenience wrapper returns %s', async status => {
		const parser = new DemoReader();
		const signal = new AbortController();
		if (status === 'cancelled') signal.abort();
		const fetcher = new MockBroadcastFetcher({
			sync: baseSync,
			defaultBytes: ok(new Uint8Array()),
			bytes: { '6/delta': status === 'complete' ? ok(endFrag()) : notFound() }
		});
		expect(
			await parser.parseHttpBroadcast('https://unused.invalid/', {
				fetcher,
				signal: signal.signal,
				maxDeltaRetries: 0
			})
		).toEqual({ status });
	});

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
		expect(await parser.parseDemo(new Uint8Array(0))).toEqual({ status: 'incomplete' });
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
		expect(await reader.run()).toEqual({ status: 'cancelled' });
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
		expect(await reader.run()).toEqual({ status: 'cancelled' });
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
		await expect(reader.run()).rejects.toBe(failure);
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
			if (result.status === 'error') endError = result.error;
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

	test.each(['0/start', '5/full', '5/delta'] as const)(
		'%s fetch failures reject start and subsequent run',
		async path => {
			const failure = new Error(path);
			const reader = new HttpBroadcastReader(new DemoReader(), 'https://unused.invalid/', {
				fetcher: new MockBroadcastFetcher({
					sync: baseSync,
					defaultBytes: ok(new Uint8Array(0)),
					bytes: { [path]: { error: failure } }
				})
			});
			await expect(reader.start()).rejects.toBe(failure);
			await expect(reader.run()).rejects.toBe(failure);
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

		expect(terminus.status).toBe('complete');
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
		expect(terminus.status).toBe('complete');
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
		expect(terminus.status).toBe('timeout');
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
		expect(terminus.status).toBe('complete');
		expect(attempts).toBe(3);
	});

	test('/full 404 exhaustion rejects startup', async () => {
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

		await expect(reader.start()).rejects.toThrow('HTTP 404 after 1 retries');
		expect(reader.sync).not.toBeNull(); // sync did succeed
		await expect(reader.run()).rejects.toThrow('HTTP 404 after 1 retries');
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
		expect(terminus.status).toBe('cancelled');
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
		expect(terminus.status).toBe('cancelled');
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
		expect(terminus.status).toBe('cancelled');
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
		const ends: { status: string }[] = [];
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
		expect(ends[0]!.status).toBe('cancelled');
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

	test('onFragmentError "abort" rejects startup', async () => {
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

		await expect(reader.start()).rejects.toBeInstanceOf(Error);
		await expect(reader.run()).rejects.toBe(errors[0]);
		expect(errors.length).toBeGreaterThan(0);
	});
});

import { describe, test, expect } from 'bun:test';
import { DemoReader } from '../../../src/index.js';
import { HttpBroadcastReader } from '../../../src/broadcast/index.js';
import type { BroadcastClock } from '../../../src/broadcast/httpReader.js';
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

/**
 * The delta loop is a single logical thread (`await sleep` → `await fetch` →
 * repeat), so sleeping is just an advance and no timer queue is needed. Starts
 * away from zero so the `_lastDeltaStartedAt` sentinel behaves as it does
 * against a real epoch.
 */
function virtualClock(start = 1_000_000) {
	let now = start;
	return {
		now: () => now,
		sleep: async (ms: number) => ((now += ms), true),
		advance: (ms: number) => void (now += ms)
	} satisfies BroadcastClock & { advance(ms: number): void };
}

describe('HttpBroadcastReader (throttle timing)', () => {
	test('deltaThrottle anchors on cycle start so fetch latency does not compound', async () => {
		const THROTTLE = 60;
		const FETCH_DELAY = 40;
		const clock = virtualClock();
		const fetchStartedAt: number[] = [];

		const slowDelta = (data: Uint8Array) => async (): Promise<FragmentResponse> => {
			fetchStartedAt.push(clock.now());
			clock.advance(FETCH_DELAY);
			return ok(data);
		};

		const fetcher = new MockBroadcastFetcher({
			sync: baseSync,
			bytes: {
				'0/start': ok(syncFrag(0)),
				'5/full': ok(syncFrag(100)),
				'5/delta': ok(syncFrag(105)),
				'6/delta': slowDelta(syncFrag(110)),
				'7/delta': slowDelta(syncFrag(120)),
				'8/delta': slowDelta(syncFrag(130)),
				'9/delta': slowDelta(syncFrag(140)),
				'10/delta': slowDelta(endFrag())
			}
		});

		const parser = new DemoReader();
		const reader = new HttpBroadcastReader(parser, 'https://example.com/', {
			fetcher,
			clock,
			deltaThrottle: THROTTLE,
			deltaRetryInterval: 0
		});

		await reader.start();
		const terminus = await reader.run();

		expect(terminus.status).toBe('complete');
		expect(fetchStartedAt.length).toBe(5);

		// Consecutive /delta fetches start exactly THROTTLE apart: the 40 ms spent
		// inside each fetch is absorbed by the interval. Pre-fix, the throttle was
		// anchored on the previous fetch's completion, so every gap would be
		// THROTTLE + FETCH_DELAY (= 100) and drift would accumulate each cycle.
		for (let i = 1; i < fetchStartedAt.length; i++) {
			expect(fetchStartedAt[i]! - fetchStartedAt[i - 1]!).toBe(THROTTLE);
		}
	});
});

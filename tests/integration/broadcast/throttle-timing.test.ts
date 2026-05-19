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

describe('HttpBroadcastReader (throttle timing)', () => {
	test('deltaThrottle anchors on cycle start so fetch latency does not compound', async () => {
		const THROTTLE = 60;
		const FETCH_DELAY = 40;
		const fetchStartedAt: number[] = [];

		const slowDelta =
			(data: Uint8Array) =>
			async (): Promise<FragmentResponse> => {
				fetchStartedAt.push(Date.now());
				await new Promise(r => setTimeout(r, FETCH_DELAY));
				return ok(data);
			};

		const fetcher = new MockBroadcastFetcher({
			sync: baseSync,
			bytes: {
				'0/start': ok(syncFrag(0)),
				'5/full': ok(syncFrag(100)),
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
			deltaThrottle: THROTTLE,
			deltaRetryInterval: 0
		});

		await reader.start();
		const terminus = await reader.run();

		expect(terminus.reason).toBe('stop');
		expect(fetchStartedAt.length).toBe(5);

		// With the fix, consecutive /delta fetches start ~THROTTLE ms apart.
		// Pre-fix, the throttle was anchored on the previous fetch's completion,
		// so gaps would be ~THROTTLE + FETCH_DELAY (= 100 ms) and accumulate
		// real-time drift on every cycle.
		for (let i = 1; i < fetchStartedAt.length; i++) {
			const gap = fetchStartedAt[i]! - fetchStartedAt[i - 1]!;
			expect(gap).toBeGreaterThanOrEqual(THROTTLE - 15);
			expect(gap).toBeLessThan(THROTTLE + FETCH_DELAY - 5);
		}
	});
});

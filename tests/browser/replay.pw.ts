import { test, expect } from '@playwright/test';
import type * as Browser from '../../src/browser.js';
import { checkpointDemo } from '../helpers/checkpointDemo.js';

test('FullPacket replay from browser File supports repeated ranges and cancellation', async ({ page }) => {
	await page.goto('/');
	const bytes = checkpointDemo();
	const result = await page.evaluate(
		async bytes => {
			const url = '/bundle.mjs';
			const { DemoReader, blobDemoSource, EntityMode } = (await import(url)) as typeof Browser;
			const source = blobDemoSource(new File([Uint8Array.from(bytes)], 'demo.dem'));
			const replay = new DemoReader();
			const parsing = replay.parseDemo(source, { entities: EntityMode.ALL });
			await replay.pause();
			const status = 'complete';
			const ticks: number[][] = [];
			const outcomes = [];
			for (const startTick of [41, 11, 41]) {
				const rangeTicks: number[] = [];
				const listener = (tick: number) => rangeTicks.push(tick);
				replay.on('tickend', listener);
				const seek = await replay.seekTo(startTick);
				if (seek.status !== 'complete') throw new Error(seek.status);
				const paused = new Promise<void>(resolve => replay.once('paused', resolve));
				replay.once('tickend', () => {
					void replay.pause();
				});
				replay.resume();
				await paused;
				outcomes.push({ status: 'complete' });
				replay.off('tickend', listener);
				ticks.push(rangeTicks);
			}
			const abort = new AbortController();
			abort.abort();
			const cancelled = await replay.seekTo(0, { signal: abort.signal });
			replay.cancel();
			await parsing;
			return {
				status,
				ticks,
				outcomes,
				cancelled,
				nodeGlobals: 'Buffer' in globalThis || 'process' in globalThis
			};
		},
		[...bytes]
	);
	expect(result).toEqual({
		status: 'complete',
		ticks: [[41], [11], [41]],
		outcomes: [{ status: 'complete' }, { status: 'complete' }, { status: 'complete' }],
		cancelled: { status: 'cancelled' },
		nodeGlobals: false
	});
});

import { test, expect } from '@playwright/test';
import { existsSync } from 'node:fs';
import type * as Browser from '../../src/browser.js';

test.beforeEach(async ({ page }) => {
	await page.goto('/');
});

test('published export parses File and fetch streams without Node globals or isolation', async ({ page }) => {
	const result = await page.evaluate(async () => {
		const moduleUrl = '/bundle.mjs';
		const { DemoReader } = (await import(moduleUrl)) as typeof Browser;
		const response = await fetch('/fixture.dem');
		const file = new File([await response.arrayBuffer()], 'fixture.dem');
		const fromFile = new DemoReader();
		const fileResult = await fromFile.parseDemo(file.stream());
		const fromFetch = new DemoReader();
		const fetchResult = await fromFetch.parseDemo((await fetch('/fixture.dem')).body!);
		return {
			fileResult,
			fetchResult,
			map: fromFile.header?.map_name,
			header: (await DemoReader.parseHeader(file))?.map_name,
			isolated: crossOriginIsolated,
			nodeGlobals: 'Buffer' in globalThis || 'process' in globalThis
		};
	});
	expect(result).toEqual({
		fileResult: { incomplete: false },
		fetchResult: { incomplete: false },
		map: 'de_dust2',
		header: 'de_dust2',
		isolated: false,
		nodeGlobals: false
	});
});

test('HTTP broadcasts decode compressed packets using embedded event descriptors', async ({ page }) => {
	const result = await page.evaluate(async () => {
		const moduleUrl = '/bundle.mjs';
		const { DemoReader } = (await import(moduleUrl)) as typeof Browser;
		const reader = new DemoReader();
		const deaths: string[] = [];
		let descriptorCount = 0;
		let reason: string | undefined;
		reader.gameEvents.on('player_death', () => deaths.push('player_death'));
		reader.on('gameeventlist', list => (descriptorCount = list.descriptors.length));
		reader.on('end', result => (reason = result.reason));
		await reader.parseHttpBroadcast(new URL('/broadcast/', location.href).href, { deltaThrottle: 0 });
		return { deaths, descriptorCount, reason };
	});
	expect(result.deaths).toEqual(['player_death']);
	expect(result.descriptorCount).toBeGreaterThan(100);
	expect(result.reason).toBe('stop');
});

test('cancellation settles a pending read and unlocks the input', async ({ page }) => {
	const result = await page.evaluate(async () => {
		const moduleUrl = '/bundle.mjs';
		const { DemoReader } = (await import(moduleUrl)) as typeof Browser;
		let cancellations = 0;
		const source = new ReadableStream<Uint8Array>({
			cancel() {
				cancellations++;
			}
		});
		const reader = new DemoReader();
		let ends = 0;
		reader.on('end', () => ends++);
		const pending = reader.parseDemo(source);
		reader.cancel();
		return { result: await pending, cancellations, ends, locked: source.locked };
	});
	expect(result).toEqual({
		result: { incomplete: true, reason: 'cancelled' },
		cancellations: 1,
		ends: 1,
		locked: false
	});
});

test('the same export runs in a module worker', async ({ page }) => {
	const result = await page.evaluate(async () => {
		const data = await (await fetch('/fixture.dem')).arrayBuffer();
		const worker = new Worker('/worker.mjs', { type: 'module' });
		try {
			return await new Promise((resolve, reject) => {
				worker.onmessage = event => resolve(event.data);
				worker.onerror = event => reject(new Error(event.message));
				worker.postMessage(data, [data]);
			});
		} finally {
			worker.terminate();
		}
	});
	expect(result).toEqual({ result: { incomplete: false }, map: 'de_dust2' });
});

test('real demo matches native parsing for entities, ticks, and game events', async ({ page, request }) => {
	test.skip(
		!existsSync(process.env.CS2_DEMO_PATH ?? 'tests/fixtures/demo.dem'),
		'Set CS2_DEMO_PATH to run the real-demo browser comparison'
	);
	const expected = await (await request.get('/expected')).json();
	const actual = await page.evaluate(async () => {
		const moduleUrl = '/bundle.mjs';
		const { DemoReader, EntityMode } = (await import(moduleUrl)) as typeof Browser;
		const reader = new DemoReader();
		let deaths = 0;
		reader.gameEvents.on('player_death', () => deaths++);
		const result = await reader.parseDemo((await fetch('/real.dem')).body!, { entities: EntityMode.ALL });
		if (result.incomplete || result.error) throw new Error(`Browser parse failed: ${result.error}`);
		return {
			tick: reader.currentTick,
			entities: reader.entities.filter(Boolean).length,
			deaths,
			map: reader.header?.map_name
		};
	});
	expect(actual).toEqual(expected);
});

import { test, expect } from '@playwright/test';
import { existsSync } from 'node:fs';
import type * as Browser from '../../src/browser.js';
import { canonicalize, sha256 } from '../helpers/parity.js';
import { BinaryWriter } from '@bufbuild/protobuf/wire';
import { bytesField, demoFile, demoFrame, networkPacket } from '../helpers/demo.js';
import { encryptedChatCiphertext, encryptedChatKeyValue } from '../helpers/encryptedChat.js';

type BrowserTestModule = typeof Browser & typeof import('../helpers/parity.js');

test.beforeEach(async ({ page }) => {
	await page.goto('/');
});

test('published browser export extracts a match key and decrypts public chat', async ({ page }) => {
	const envelope = new BinaryWriter().uint32(10).bytes(encryptedChatCiphertext).uint32(16).int32(2).finish();
	const demo = demoFile(demoFrame(7, bytesField(3, networkPacket([{ id: 78, body: envelope }]))), demoFrame(0));
	const info = bytesField(3, new BinaryWriter().uint32(56).uint64(encryptedChatKeyValue).finish());
	const result = await page.evaluate(
		async ({ demo, info }) => {
			const moduleUrl = '/bundle.mjs';
			const { DemoReader, extractPublicEncryptionKey } = (await import(moduleUrl)) as typeof Browser;
			const reader = new DemoReader();
			const texts: string[] = [];
			reader.on('chat', message => texts.push(message.text));
			const end = await reader.parseDemo(new Blob([Uint8Array.from(demo)]).stream(), {
				decryptionKey: extractPublicEncryptionKey(Uint8Array.from(info))
			});
			return { texts, end, nodeGlobals: 'Buffer' in globalThis || 'process' in globalThis };
		},
		{ demo: [...demo], info: [...info] }
	);
	expect(result).toEqual({ texts: ['Hello, world!'], end: { status: 'complete' }, nodeGlobals: false });
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
		const header = DemoReader.parseHeaderAsync(file);
		const serverInfo = DemoReader.parseServerInfoAsync(file);
		const fileInfo = DemoReader.parseFileInfoAsync(file);
		return {
			fileResult,
			fetchResult,
			map: fromFile.header?.map_name,
			header: (await header)?.map_name,
			serverInfo: await serverInfo,
			fileInfo: await fileInfo,
			metadataPromises: [header, serverInfo, fileInfo].every(result => result instanceof Promise),
			hasSyncMetadata: ['parseHeader', 'parseServerInfo', 'parseFileInfo'].some(name => name in DemoReader),
			isolated: crossOriginIsolated,
			nodeGlobals: 'Buffer' in globalThis || 'process' in globalThis
		};
	});
	expect(result).toEqual({
		fileResult: { status: 'complete' },
		fetchResult: { status: 'complete' },
		map: 'de_dust2',
		header: 'de_dust2',
		serverInfo: null,
		fileInfo: null,
		metadataPromises: true,
		hasSyncMetadata: false,
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
		reader.on('end', result => (reason = result.status));
		await reader.parseHttpBroadcast(new URL('/broadcast/', location.href).href, { deltaThrottle: 0 });
		return { deaths, descriptorCount, reason };
	});
	expect(result.deaths).toEqual(['player_death']);
	expect(result.descriptorCount).toBeGreaterThan(100);
	expect(result.reason).toBe('complete');
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
		result: { status: 'cancelled' },
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
	expect(result).toEqual({ result: { status: 'complete' }, map: 'de_dust2' });
});

test('portable snapshot hashing preserves values without Node globals', async ({ page }) => {
	const actual = await page.evaluate(async () => {
		const moduleUrl = '/bundle.mjs';
		const { canonicalize, sha256 } = (await import(moduleUrl)) as BrowserTestModule;
		const text = canonicalize({
			z: undefined,
			bytes: new Uint8Array([99, 1, 2, 99]).subarray(1, 3),
			values: [9007199254740993n, -0, NaN, Infinity, -Infinity, new Float32Array([-0]), new BigUint64Array([1n])]
		});
		return {
			text,
			hash: await sha256(text),
			knownHash: await sha256('abc'),
			nodeGlobals: 'Buffer' in globalThis || 'process' in globalThis
		};
	});
	const text = canonicalize({
		values: [9007199254740993n, -0, NaN, Infinity, -Infinity, new Float32Array([-0]), new BigUint64Array([1n])],
		bytes: Buffer.from([1, 2]),
		z: undefined
	});
	expect(actual).toEqual({
		text,
		hash: await sha256(text),
		knownHash: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
		nodeGlobals: false
	});
});

// Deep state/event parity once per engine; mode and chunk coverage lives in Bun integration tests.
test('real demo deep parity: ALL / fetch stream', async ({ page, request }) => {
	test.setTimeout(300000);
	test.skip(
		!existsSync(process.env.CS2_DEMO_PATH ?? 'tests/fixtures/demo.dem'),
		'Set CS2_DEMO_PATH for real-demo parity'
	);
	const response = await request.get('/expected?mode=ALL', { timeout: 300000 });
	expect(response.ok()).toBe(true);
	const expected = await response.json();
	const actual = await page.evaluate(async () => {
		const moduleUrl = '/bundle.mjs';
		const { DemoReader, EntityMode, captureParity } = (await import(moduleUrl)) as BrowserTestModule;
		const response = await fetch('/real.dem');
		if (!response.ok) throw new Error(`Fixture HTTP ${response.status}`);
		const reader = new DemoReader();
		const capture = captureParity(reader, 'ALL');
		const result = await reader.parseDemo(response.body!, { entities: EntityMode.ALL });
		if (result.status !== 'complete') throw new Error(`Browser parse ${result.status}`);
		return {
			parity: await capture.finish(),
			nodeGlobals: 'Buffer' in globalThis || 'process' in globalThis,
			isolated: crossOriginIsolated
		};
	});
	expect(actual).toEqual({ parity: expected, nodeGlobals: false, isolated: false });
});

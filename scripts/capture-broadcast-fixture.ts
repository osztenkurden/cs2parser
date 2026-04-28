#!/usr/bin/env bun
/**
 * Capture a small live CS2 GOTV broadcast fixture to disk for the optional
 * captured-fixture integration test.
 *
 * Usage:
 *   bun scripts/capture-broadcast-fixture.ts <broadcast-url> [outputDir]
 *
 * Defaults outputDir to `tests/fixtures/broadcast/captured/`. Captures
 * `sync.json`, `<signup_fragment>/start.bin`, `<fragment>/full.bin`, and the
 * next ~3 `<N>/delta.bin` fragments, then exits.
 */

import fs from 'fs';
import path from 'path';
import { createDefaultFetcher, type BroadcastFetcher } from '../src/broadcast/index.js';

const url = process.argv[2];
const outDir = process.argv[3] ?? 'tests/fixtures/broadcast/captured';
if (!url) {
	console.error('Usage: bun scripts/capture-broadcast-fixture.ts <broadcast-url> [outputDir]');
	process.exit(1);
}

const fetcher: BroadcastFetcher = createDefaultFetcher(url);

const writeFile = (relPath: string, contents: Buffer | string): void => {
	const full = path.join(outDir, relPath);
	fs.mkdirSync(path.dirname(full), { recursive: true });
	fs.writeFileSync(full, contents);
	console.log(`wrote ${full}`);
};

console.log(`[capture] fetching /sync from ${url}`);
const sync = await fetcher.json<Record<string, unknown>>('sync');
writeFile('sync.json', JSON.stringify(sync, null, 2));

const signup = sync['signup_fragment'] as number;
const fragment = sync['fragment'] as number;
const tokenRedirect = (sync['token_redirect'] as string | undefined) ?? '';
const prefix = tokenRedirect ? tokenRedirect.replace(/\/+$/, '') + '/' : '';

const fetchAndWrite = async (relPath: string, outFile: string) => {
	const result = await fetcher.bytes(relPath);
	if (!result.ok) {
		console.error(`[capture] ${relPath} → HTTP ${result.status}`);
		return false;
	}
	writeFile(outFile, Buffer.from(result.data));
	return true;
};

await fetchAndWrite(`${prefix}${signup}/start`, `${signup}/start.bin`);
await fetchAndWrite(`${prefix}${fragment}/full`, `${fragment}/full.bin`);

for (let i = 0; i < 3; i++) {
	const n = fragment + i;
	const ok = await fetchAndWrite(`${prefix}${n}/delta`, `${n}/delta.bin`);
	if (!ok) {
		// Wait a moment and retry once — relays often need a beat for the next delta.
		await new Promise(r => setTimeout(r, 1000));
		await fetchAndWrite(`${prefix}${n}/delta`, `${n}/delta.bin`);
	}
}

console.log(`[capture] done. fixtures in ${outDir}`);

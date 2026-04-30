#!/usr/bin/env bun
/**
 * Extract `CMsgSource1LegacyGameEventList` from a .dem file and write its
 * protobuf-encoded bytes to disk. The output can be loaded by
 * `HttpBroadcastReader` (via `gameEventDescriptors`) so that broadcast streams
 * — which only deliver the descriptor list once at game start and may have
 * advanced past it by the time a client connects — can still resolve event
 * names.
 *
 * Usage:
 *   bun scripts/dump-event-descriptors.ts <demo.dem> [out.bin]
 *
 * Default output path is `<demo>.event-descriptors.bin` next to the input.
 */

import fs from 'fs';
import path from 'path';
import { DemoReader } from '../src/index.js';
import { CMsgSource1LegacyGameEventList } from '../src/ts-proto/gameevents.js';

const inputPath = process.argv[2];
const outputPath = process.argv[3] ?? `${inputPath}.event-descriptors.bin`;

if (!inputPath) {
	console.error('usage: bun scripts/dump-event-descriptors.ts <demo.dem> [out.bin]');
	process.exit(1);
}

if (!fs.existsSync(inputPath)) {
	console.error(`[dump] file not found: ${inputPath}`);
	process.exit(1);
}

const reader = new DemoReader();

let captured: CMsgSource1LegacyGameEventList | null = null;

reader.on('gameeventlist', list => {
	captured = list;
	reader.cancel();
});

console.log(`[dump] parsing ${inputPath}…`);
await reader.parseDemo(inputPath);

if (!captured) {
	console.error('[dump] no gameeventlist found in demo (parsing finished without one)');
	process.exit(1);
}

const list = captured as CMsgSource1LegacyGameEventList;
const encoded = CMsgSource1LegacyGameEventList.encode(list).finish();
fs.mkdirSync(path.dirname(path.resolve(outputPath)), { recursive: true });
fs.writeFileSync(outputPath, encoded);

console.log(`[dump] wrote ${encoded.length} bytes (${list.descriptors.length} descriptors) to ${outputPath}`);

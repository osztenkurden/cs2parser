#!/usr/bin/env bun
/**
 * Probe a live CS2 GOTV HTTP broadcast.
 *
 * Usage:
 *   bun scripts/probe-broadcast.ts <broadcast-url>
 *
 * Logs the /sync metadata, the first ~10 game events, and the final tick +
 * entity count + terminal reason. Useful for sanity-checking the protocol
 * implementation against a real relay.
 */

import { DemoReader, EntityMode, HttpBroadcastReader } from '../src/index.js';

const url = process.argv[2];
if (!url) {
	console.error('Usage: bun scripts/probe-broadcast.ts <broadcast-url>');
	process.exit(1);
}

const parser = new DemoReader();

parser.on('broadcastsync', sync => {
	console.log('[sync]', JSON.stringify(sync, null, 2));
});

let eventCount = 0;
parser.on('gameevent', e => {
	if (eventCount < 10) {
		console.log(`[gameevent #${eventCount}]`, e.event_name);
	}
	eventCount++;
});

parser.on('serverinfo', info => {
	console.log('[serverinfo] tick_interval=', info.tick_interval, 'map=', info.map_name);
});

const reader = new HttpBroadcastReader(parser, url, {
	entities: EntityMode.ALL
});

const onSig = () => {
	console.log('[probe] cancelling…');
	reader.stop();
};
process.on('SIGINT', onSig);
process.on('SIGTERM', onSig);

console.log(`[probe] connecting to ${url}`);
await reader.start();
const terminus = await reader.run();

console.log(
	`[probe] done. reason=${terminus.reason} tick=${parser.currentTick} entities=${parser.entities.filter(Boolean).length} events=${eventCount}`
);
if (terminus.reason === 'error') {
	console.error('[probe] terminal error:', terminus.error);
	process.exit(1);
}

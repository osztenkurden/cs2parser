import { readFileSync } from 'fs';
import { DemoReader, EntityMode, HttpBroadcastReader } from '../src/index.js';

const relayUrl = process.argv[2];
const descriptorPath = process.argv[3];
if (!relayUrl) {
	console.error('Usage: bun examples/broadcast.ts <relay-url> [event-descriptors.bin]');
	process.exit(1);
}

const reader = new DemoReader();
reader.gameEvents.on('player_hurt', hurt => {
	// Attacker and victim are auto-resolved Player helpers with entities enabled.
	console.log(
		`[${reader.currentTick}] ${hurt.attackerPlayer?.name} hurt ${hurt.player?.name} for ${hurt.dmg_health} damage with ${hurt.weapon}`
	);
});

reader.on('broadcastsync', sync => console.log('[sync]', JSON.stringify(sync, null, 2)));
reader.on('serverinfo', info => {
	console.log('[serverinfo] tick_interval=', info.tick_interval, 'map=', info.map_name);
});

// Raw events may carry only an ID, even when descriptors have been preloaded.
const eventNames = new Map<number, string>();
reader.on('gameeventlist', list => {
	eventNames.clear();
	for (const { eventid, name } of list.descriptors) {
		if (eventid !== undefined && name) eventNames.set(eventid, name);
	}
});
let eventCount = 0;
reader.on('gameevent', event => {
	eventCount++;
	if (eventCount <= 10) {
		console.log(
			`[gameevent #${eventCount}]`,
			event.event_name ?? eventNames.get(event.eventid ?? -1) ?? event.eventid
		);
	}
});
reader.on('end', end => {
	console.log(
		`[broadcast] done. reason=${end.reason} tick=${reader.currentTick} entities=${reader.entities.filter(Boolean).length} events=${eventCount}`
	);
});

const httpReader = new HttpBroadcastReader(reader, relayUrl, {
	entities: EntityMode.ALL,
	// Optional dump-event-descriptors.ts output overrides the bundled descriptors.
	gameEventDescriptors: descriptorPath ? readFileSync(descriptorPath) : undefined
});

const onSignal = () => {
	console.log('[broadcast] cancelling...');
	httpReader.stop();
};
process.on('SIGINT', onSignal);
process.on('SIGTERM', onSignal);

try {
	console.log(`[broadcast] connecting to ${relayUrl}`);
	await httpReader.start();
	const terminus = await httpReader.run();
	if (terminus.reason === 'error') throw terminus.error;
} catch (error) {
	console.error('[broadcast] failed:', error);
	process.exitCode = 1;
} finally {
	process.off('SIGINT', onSignal);
	process.off('SIGTERM', onSignal);
}

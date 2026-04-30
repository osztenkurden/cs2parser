import { DemoReader, EntityMode, HttpBroadcastReader } from '../src';

const relayUrl = process.argv[2];
if (!relayUrl) {
	console.error('Usage: bun examples/broadcast.ts <relay-url>');
	process.exit(1);
}

const reader = new DemoReader();
reader.gameEvents.on('player_hurt', hurt => {
	console.log(reader.currentTick);
	console.log(
		`Hurt, ${hurt.dmg_health} (attacker: ${hurt.attackerPlayer?.name}) (player: ${hurt.player?.name}) DMG by ${hurt}`
	);
});

reader.on('broadcastsync', console.log);

const httpReader = new HttpBroadcastReader(reader, relayUrl, {
	entities: EntityMode.ALL
});
await httpReader.start();
const terminus = await httpReader.run();
console.log(terminus);

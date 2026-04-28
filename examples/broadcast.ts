import fs from 'fs';
import { DemoReader, EntityMode, HttpBroadcastReader } from '../src';

const reader = new DemoReader();
reader.gameEvents.on('player_hurt', hurt => {
	console.log(reader.currentTick);
	console.log(
		`Hurt, ${hurt.dmg_health} (attacker: ${hurt.attackerPlayer?.name}) (player: ${hurt.player?.name}) DMG by ${hurt}`
	);
});
reader.on('broadcastsync', console.log);

const descriptorPath = 'event-descriptors.bin';
const gameEventDescriptors = fs.existsSync(descriptorPath) ? fs.readFileSync(descriptorPath) : undefined;

const httpRader = new HttpBroadcastReader(reader, 'http://localhost:8080/s90285080700576797t1777391342/', {
	gameEventDescriptors,
	entities: EntityMode.ALL
});
await httpRader.start();
const terminus = await httpRader.run();
console.log(terminus);

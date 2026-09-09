import { DemoReader } from './../src/index.js';
const demoPath = process.argv[2];

if (!demoPath) {
	console.error('Usage: bun examples/chat.ts <path-to-demo>');
	process.exit(1);
}

const reader = new DemoReader();

// CS2 uses both chat messages depending on the server. UM_SayText2 carries the
// sender's entity index and localisation params; UM_SayText carries a player
// index and a pre-formatted string. Listen for both or you'll miss half of them.
reader.on('UM_SayText2', e => {
	if (e.entityindex === undefined) return;
	const player = reader.players[e.entityindex - 1];
	console.log(player?.name, e.param2);
});

reader.on('UM_SayText', e => {
	const player = e.playerindex !== undefined ? reader.players[e.playerindex - 1] : undefined;
	console.log(player?.name, e.text);
});

reader.gameEvents.on('player_chat', console.log);

await reader.parseDemo(demoPath);

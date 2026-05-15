import { DemoReader } from './../src/index.js';
const demoPath =
	process.argv[2] ??
	`C:\\Program Files (x86)\\Steam\\steamapps\\common\\Counter-Strike Global Offensive\\game\\csgo\\replays\\match730_003818066533465194565_1157371786_187.dem`;

// Also available for tests: E:\\Repositories\\cs2p\\examples\\chat.dem
if (!demoPath) {
	console.error(`Usage: bun chat.ts <path-to-demo>`);
	process.exit(1);
}

const reader = new DemoReader();
reader.on('UM_SayText2', e => {
	if (e.entityindex === undefined) return;
	const player = reader.players[e.entityindex - 1];
	console.log(player?.name, e.param2);
});
reader.gameEvents.on('player_chat', console.log);
await reader.parseDemo(demoPath, { UM_SayText2: true });

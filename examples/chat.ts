import { DemoReader } from '../src/index.js';
const demoPath = process.argv[2];

if (!demoPath) {
	console.error('Usage: bun examples/chat.ts <path-to-demo>');
	process.exit(1);
}

const reader = new DemoReader();

// The chat event combines both SayText formats and resolves the sender.
reader.on('chat', message => {
	console.log(message.playerInfo?.name ?? 'server', message.text);
});

// Userinfo is available without entity parsing.
await reader.parseDemo(demoPath);

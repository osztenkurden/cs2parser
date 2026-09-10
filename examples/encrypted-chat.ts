import { readFileSync } from 'node:fs';
import { DemoReader, extractPublicEncryptionKey } from '../src/index.js';

const demoPath = process.argv[2];
const infoPath = process.argv[3] ?? `${demoPath}.info`;
if (!demoPath) {
	console.error('Usage: bun examples/encrypted-chat.ts <demo.dem> [matching.dem.info]');
	process.exit(1);
}

const decryptionKey = extractPublicEncryptionKey(readFileSync(infoPath));
const reader = new DemoReader();
reader.on('chat', message => {
	const sender = message.playerInfo?.name;
	console.log(`[${reader.currentTick}] ${sender ?? 'server'}: ${message.text}`);
});
reader.on('debug', message => console.error(message));
const result = await reader.parseDemo(demoPath, { decryptionKey });
if (result.error || result.incomplete) {
	console.error('Demo parsing did not complete:', result);
	process.exitCode = 1;
}

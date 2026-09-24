import { describe, test, expect } from 'bun:test';
import fs from 'fs';
import { DemoReader } from '../../src/index.js';

const demoPath = process.env.CS2_DEMO_PATH ?? 'tests/fixtures/demo.dem';
const demoAvailable = fs.existsSync(demoPath);

// Override/attach/detach semantics are covered on synthetic packets in
// tests/unit/message-subscriptions.test.ts; this checks real demo bytes once.
describe.skipIf(!demoAvailable)('message subscriptions', () => {
	test('listeners alone decode messages outside the old curated list, and anymessage sees them', async () => {
		const reader = new DemoReader();
		const counts = { sound: 0, classInfo: 0 };
		const names = new Set<string>();
		reader.on('GE_SosStartSoundEvent', () => counts.sound++);
		reader.on('svc_ClassInfo', () => counts.classInfo++);
		reader.on('anymessage', msg => {
			if (msg.name) names.add(msg.name);
		});
		// Cancelling early keeps this cheap: the point is whether a message is decoded at all.
		reader.on('tickstart', tick => {
			if (tick >= 20000) reader.cancel();
		});

		await reader.parseDemo(demoPath);

		expect(counts.sound).toBeGreaterThan(0);
		expect(counts.classInfo).toBeGreaterThan(0);
		expect(names.size).toBeGreaterThan(5);
	});
});

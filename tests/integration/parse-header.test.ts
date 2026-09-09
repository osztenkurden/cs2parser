import { describe, test, expect } from 'bun:test';
import { DemoReader } from '../../src/index.js';
import fs from 'fs';

const demoPath = process.env.CS2_DEMO_PATH ?? 'tests/fixtures/demo.dem';
const demoAvailable = fs.existsSync(demoPath);

describe.skipIf(!demoAvailable)('parseHeader', () => {
	test('synchronous metadata matches asynchronous metadata on the real demo', async () => {
		const bytes = fs.readFileSync(demoPath);
		for (const [sync, async] of [
			['parseHeaderSync', 'parseHeader'],
			['parseServerInfoSync', 'parseServerInfo'],
			['parseFileInfoSync', 'parseFileInfo']
		] as const) {
			const expected = await DemoReader[async](demoPath);
			expect(DemoReader[sync](demoPath)).toEqual(expected);
			expect(DemoReader[sync](bytes)).toEqual(expected);
		}
	});

	test('reads demo file header successfully', async () => {
		const header = await DemoReader.parseHeader(demoPath);
		expect(header).not.toBeNull();
	});

	test('header contains expected fields', async () => {
		const header = await DemoReader.parseHeader(demoPath);
		expect(header).not.toBeNull();
		if (!header) return;

		// Demo file header should have basic info
		expect(typeof header.demo_file_stamp).toBe('string');
		expect(header.demo_file_stamp?.length).toBeGreaterThan(0);
	});
});

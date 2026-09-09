import { describe, test, expect } from 'bun:test';
import { DemoReader } from '../../src/index.js';
import fs from 'fs';

const demoPath = process.env.CS2_DEMO_PATH ?? 'tests/fixtures/demo.dem';
const demoAvailable = fs.existsSync(demoPath);

describe.skipIf(!demoAvailable)('real demo metadata', () => {
	test('real fields and all three synchronous path/Buffer helpers match async metadata', async () => {
		const bytes = fs.readFileSync(demoPath);
		const header = await DemoReader.parseHeaderAsync(demoPath);
		const info = await DemoReader.parseServerInfoAsync(demoPath);
		const fileInfo = await DemoReader.parseFileInfoAsync(demoPath);
		for (const [sync, expected] of [
			['parseHeader', header],
			['parseServerInfo', info],
			['parseFileInfo', fileInfo]
		] as const) {
			expect(DemoReader[sync](demoPath)).toEqual(expected);
			expect(DemoReader[sync](bytes)).toEqual(expected);
		}
		expect(typeof header?.demo_file_stamp).toBe('string');
		expect(header?.demo_file_stamp?.length).toBeGreaterThan(0);
		expect(typeof info?.map_name).toBe('string');
		expect(info?.map_name?.length).toBeGreaterThan(0);
		expect(typeof info?.max_clients).toBe('number');
		expect(info?.max_clients).toBeGreaterThan(0);
	});
});

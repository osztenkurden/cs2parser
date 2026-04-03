import { describe, test, expect } from 'bun:test';
import { DemoReader } from '../../src/index.js';
import fs from 'fs';

const demoPath = process.env.CS2_DEMO_PATH ?? 'tests/fixtures/demo.dem';
const demoAvailable = fs.existsSync(demoPath);

describe.skipIf(!demoAvailable)('parseServerInfo', () => {
	test('reads server info successfully', () => {
		const info = DemoReader.parseServerInfo(demoPath);
		expect(info).not.toBeNull();
	});

	test('server info contains expected fields', () => {
		const info = DemoReader.parseServerInfo(demoPath);
		expect(info).not.toBeNull();
		if (!info) return;

		expect(typeof info.map_name).toBe('string');
		expect(info.map_name!.length).toBeGreaterThan(0);
		expect(typeof info.max_clients).toBe('number');
		expect(info.max_clients).toBeGreaterThan(0);
	});

	test('throws for nonexistent file', () => {
		expect(() => DemoReader.parseServerInfo('nonexistent.dem')).toThrow();
	});
});

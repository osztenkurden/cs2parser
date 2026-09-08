import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: './tests/browser',
	testMatch: '**/*.pw.ts',
	timeout: 120000,
	workers: 1,
	use: { baseURL: 'http://127.0.0.1:4178' },
	projects: ['chromium', 'firefox', 'webkit'].map(browserName => ({
		name: browserName,
		use: { browserName: browserName as 'chromium' | 'firefox' | 'webkit' }
	})),
	webServer: {
		command: 'bun scripts/browser-test-server.ts',
		url: 'http://127.0.0.1:4178',
		timeout: 120000
	}
});

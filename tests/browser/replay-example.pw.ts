import { test, expect } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const fixture = process.env.CS2_DEMO_PATH ?? 'tests/fixtures/demo.dem';

test('local File example pauses continuous parsing, seeks and resumes by tick', async ({ page }) => {
	test.skip(!existsSync(fixture), 'Real demo fixture is not available');
	await page.route('**/examples/replay.html', route =>
		route.fulfill({
			contentType: 'text/html',
			body: readFileSync('examples/replay.html', 'utf8')
		})
	);
	// The harness already bundles the package's browser export, as the example build command does.
	await page.route('**/dist/replay-browser.js', route =>
		route.fulfill({
			contentType: 'text/javascript',
			body: "export * from '/bundle.mjs';"
		})
	);
	await page.goto('/examples/replay.html');
	await page.locator('#file').setInputFiles(resolve(fixture));
	await expect(page.locator('#seek')).toBeEnabled({ timeout: 90000 });
	await expect(page.locator('#output')).toContainText('No full-match indexing');
	await page.locator('#tick').fill('10000');
	await page.locator('#seek').click();
	await expect(page.locator('#output')).toContainText(/^paused\nTick /, { timeout: 30000 });
});

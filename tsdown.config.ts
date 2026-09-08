import { defineConfig } from 'tsdown';

export default defineConfig({
	entry: { index: 'src/index.ts', browser: 'src/browser.ts' },
	platform: 'neutral',
	fixedExtension: true,
	deps: { neverBundle: [/^node:/] },
	target: 'es2022',
	outDir: 'dist'
});

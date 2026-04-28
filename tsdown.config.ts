import { defineConfig } from 'tsdown';

export default defineConfig({
	entry: 'src/index.ts',
	outDir: 'dist',
	copy: [
		// Default game-event descriptor list, loaded by HttpBroadcastReader at
		// runtime via `import.meta.url`. Must end up next to the bundled output
		// (`dist/default-event-descriptors.bin`).
		{ from: 'src/broadcast/default-event-descriptors.bin', to: 'dist' }
	]
});

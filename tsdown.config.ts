import { defineConfig } from 'tsdown';

export default defineConfig({
	entry: 'src/index.ts',
	outDir: 'dist',
	// Native addon — resolved at runtime by Node, not bundled into the .mjs.
	// When the package is published, `cs2parser-native` is replaced by the
	// per-platform optionalDependencies (Phase 8). For local development the
	// workspace symlink at `node_modules/cs2parser-native` resolves to
	// `crates/native/`.
	deps: {
		neverBundle: ['cs2parser-native']
	},
	copy: [
		// Default game-event descriptor list, loaded by HttpBroadcastReader at
		// runtime via `import.meta.url`. Must end up next to the bundled output
		// (`dist/default-event-descriptors.bin`).
		{ from: 'src/broadcast/default-event-descriptors.bin', to: 'dist' }
	]
});

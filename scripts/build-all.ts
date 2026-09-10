/**
 * Regenerate all parser sources and embedded assets from a new demo.
 * Usage: bun scripts/build-all.ts <demo.dem>
 * Requires Bun, protoc, Clang, wasm-ld, and internet access.
 */
import { spawnSync } from 'node:child_process';
import { statSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const usage = 'Usage: bun scripts/build-all.ts <demo.dem>';
const args = process.argv.slice(2);
if (args.length === 1 && (args[0] === '--help' || args[0] === '-h')) {
	console.log(usage);
	console.log('Regenerates protos, message/delta schemas, entity/event types, broadcast descriptors, and Snappy WASM.');
	console.log('Requires Bun, protoc, Clang, wasm-ld, development dependencies, and internet access.');
	process.exit(0);
}

function main() {
	if (args.length !== 1 || !args[0]?.trim() || args[0].startsWith('-')) throw new Error(usage);
	// Resolve the demo before changing the child processes' working directory.
	const demo = resolve(args[0]);
	if (!statSync(demo).isFile()) throw new Error(`Demo is not a file: ${demo}`);
	const root = fileURLToPath(new URL('../', import.meta.url));
	const steps: { label: string; commands: string[][] }[] = [
		{ label: 'Download protos and generate TypeScript bindings', commands: [['scripts/generate-protos.ts']] },
		{
			label: 'Generate message registry and user-command delta schema',
			commands: [['scripts/generate-message-registry.ts'], ['scripts/generate-usercmd-delta-schema.ts']]
		},
		{ label: 'Generate entity types and snapshot', commands: [['scripts/generate-entity-types.ts', '--demo', demo]] },
		{ label: 'Generate game-event types', commands: [['scripts/generate-event-types.ts', demo]] },
		{
			label: 'Extract and embed broadcast event descriptors',
			commands: [
				['scripts/dump-event-descriptors.ts', demo, 'src/broadcast/default-event-descriptors.bin'],
				['scripts/generate-broadcast-descriptors.ts']
			]
		},
		{ label: 'Build embedded Snappy WASM', commands: [['scripts/build-snappy-wasm.ts']] }
	];

	for (const [index, step] of steps.entries()) {
		console.log(`\n[${index + 1}/${steps.length}] ${step.label}`);
		for (const command of step.commands) {
			const result = spawnSync(process.execPath, command, { cwd: root, stdio: 'inherit' });
			if (result.error) throw result.error;
			if (result.status !== 0) {
				throw new Error(`${command[0]} failed (${result.signal ?? `exit ${result.status}`}). Regeneration stopped.`);
			}
		}
	}
	console.log('\nAll regeneration steps completed.');
}

try {
	main();
} catch (error) {
	console.error(error instanceof Error ? error.message : error);
	process.exitCode = 1;
}

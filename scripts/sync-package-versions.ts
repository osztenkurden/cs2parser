/**
 * Syncs the version field across:
 *  - the root `package.json` (main `cs2parser` package — usually already
 *    bumped by release-please, used as the source of truth);
 *  - `crates/native/package.json` (the loader `cs2parser-native` package);
 *  - every `crates/native/npm/<triple>/package.json` (per-triple binary
 *    sub-packages);
 *  - the version pin on `cs2parser-native` inside `crates/native/package.json`'s
 *    `optionalDependencies` plus the root package's `dependencies` entry.
 *
 * Usage: `bun scripts/sync-package-versions.ts`
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// `fileURLToPath` resolves the file URL to a real OS path on every platform.
// (Manually stripping the leading slash off `new URL(...).pathname` only works
// on Windows `/C:/…` URLs and breaks on Linux `/home/…`, where the slash is
// part of the absolute path — that produced a relative path + ENOENT in CI.)
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function readJson(file: string) {
	return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file: string, obj: unknown) {
	fs.writeFileSync(file, JSON.stringify(obj, null, '\t') + '\n');
}

const rootPkg = readJson(path.join(ROOT, 'package.json'));
const version = rootPkg.version as string;
if (!version) throw new Error('root package.json has no version');
console.log(`Syncing to version ${version}`);

// Root package.json: pin its `cs2parser-native` dep at this version.
if (rootPkg.dependencies?.['cs2parser-native']) {
	rootPkg.dependencies['cs2parser-native'] = version;
	writeJson(path.join(ROOT, 'package.json'), rootPkg);
}

// Loader package + its optionalDependencies pins.
const loaderFile = path.join(ROOT, 'crates/native/package.json');
const loader = readJson(loaderFile);
loader.version = version;
for (const dep of Object.keys(loader.optionalDependencies ?? {})) {
	loader.optionalDependencies[dep] = version;
}
writeJson(loaderFile, loader);

// Per-triple sub-packages.
const npmDir = path.join(ROOT, 'crates/native/npm');
for (const sub of fs.readdirSync(npmDir)) {
	const file = path.join(npmDir, sub, 'package.json');
	if (!fs.existsSync(file)) continue;
	const pkg = readJson(file);
	pkg.version = version;
	writeJson(file, pkg);
	console.log(`  updated ${path.relative(ROOT, file)}`);
}

console.log('done');

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const BENCHMARK_SCRIPT = path.join(__dirname, 'benchmark.ts');
const BENCHMARK_MD = path.join(ROOT, 'benchmark.md');
const README_MD = path.join(ROOT, 'README.md');

// Pass through all argv to the benchmark script
const args = process.argv.slice(2).map(a => JSON.stringify(a)).join(' ');

console.log('Running benchmark...\n');
execSync(`bun --expose-gc ${BENCHMARK_SCRIPT} ${args}`, { cwd: ROOT, stdio: 'inherit', timeout: 600000 });

// Read the generated benchmark.md (skip the "# Benchmark Results" title)
const benchmarkContent = fs.readFileSync(BENCHMARK_MD, 'utf-8');
const benchmarkLines = benchmarkContent.split('\n');
// Drop the "# Benchmark Results" heading and leading blank lines
const startIdx = benchmarkLines.findIndex((l, i) => i > 0 && l.trim().length > 0);
const benchmarkBody = benchmarkLines.slice(startIdx).join('\n').trimEnd();

// Read README and replace the ## Performance section
const readme = fs.readFileSync(README_MD, 'utf-8');

const perfStart = readme.indexOf('## Performance');
if (perfStart === -1) {
	console.error('Could not find "## Performance" section in README.md');
	process.exit(1);
}

// Find the next ## heading after Performance that is NOT a benchmark sub-heading.
// Benchmark.md contains "## Entity Mode Comparison" and "## Parse Method Comparison" —
// skip those when looking for the section boundary.
const benchmarkHeadings = new Set(
	benchmarkBody.split('\n').filter(l => l.startsWith('## ')).map(l => l.trim())
);
let perfEnd = -1;
let searchPos = perfStart + 1;
while (true) {
	const idx = readme.indexOf('\n## ', searchPos);
	if (idx === -1) { perfEnd = readme.length; break; }
	const lineEnd = readme.indexOf('\n', idx + 1);
	const heading = readme.slice(idx + 1, lineEnd === -1 ? undefined : lineEnd).trim();
	if (!benchmarkHeadings.has(heading)) { perfEnd = idx; break; }
	searchPos = idx + 1;
}

const newReadme =
	readme.slice(0, perfStart) +
	'## Performance\n\n' +
	benchmarkBody +
	'\n' +
	readme.slice(perfEnd);

fs.writeFileSync(README_MD, newReadme);
console.log(`\nUpdated ${README_MD} with new benchmark results.`);

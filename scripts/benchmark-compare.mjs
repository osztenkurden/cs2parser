import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { cpus } from 'node:os';
import { resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const usage = 'Usage: bun scripts/benchmark-compare.mjs DEMO [--runs 5] [--cases FILE] [--json FILE] [--markdown FILE]';
const [demo, ...args] = process.argv.slice(2);
if (!demo?.trim() || demo.startsWith('-')) throw new Error(usage);
const options = new Map();
for (let i = 0; i < args.length; i += 2) {
	const [flag, value] = args.slice(i, i + 2);
	if (!['--runs', '--cases', '--json', '--markdown'].includes(flag) || options.has(flag)) {
		throw new Error(`Unknown or duplicate option: ${flag}\n${usage}`);
	}
	if (!value?.trim() || value.startsWith('-')) throw new Error(`Missing value for ${flag}\n${usage}`);
	options.set(flag, value);
}
const repeatArg = options.get('--runs') ?? '5';
const repeats = Number(repeatArg);
if (!/^\d+$/.test(repeatArg) || !Number.isSafeInteger(repeats) || repeats < 1) {
	throw new Error('--runs must be a positive safe integer');
}
const stat = statSync(demo);
if (!stat.isFile()) throw new Error('DEMO must be a file');
const paths = [demo, ...['--cases', '--json', '--markdown'].map(k => options.get(k)).filter(Boolean)].map(p =>
	resolve(p)
);
if (new Set(paths).size !== paths.length) throw new Error('Demo, cases, JSON and Markdown paths must be distinct');

const modes = ['NONE', 'ONLY_GAME_RULES', 'ALL'];
const defaults = [
	...modes.map(mode => [mode, 'path-stream']),
	...['path-sync', 'buffer', 'stream'].map(m => ['ALL', m])
];
const config = options.has('--cases')
	? JSON.parse(readFileSync(options.get('--cases'), 'utf8'))
	: defaults.map(([mode, method]) => ({
			name: `${mode} ${method}`,
			runtime: 'bun',
			entry: 'cs2parser',
			method,
			mode,
			subscriptions: 'none'
		}));
const input = Array.isArray(config) ? config : config?.cases;
if (!Array.isArray(input) || !input.length)
	throw new Error('--cases must contain a nonempty array or an object with .cases');
const names = new Set();
const cases = input.map((c, i) => {
	if (
		!c ||
		['name', 'runtime', 'entry'].some(k => typeof c[k] !== 'string' || !c[k].trim() || /[\0\r\n]/.test(c[k]))
	) {
		throw new Error(
			`Case ${i + 1}: name, runtime (executable) and entry (module specifier) must be nonempty strings`
		);
	}
	const { name, runtime, entry, method, mode, subscriptions = 'death' } = c;
	if (!['path-stream', 'path-sync', 'buffer', 'stream', 'web-stream'].includes(method))
		throw new Error(`${name}: invalid method`);
	if (!modes.includes(mode)) throw new Error(`${name}: invalid mode (use NONE, ONLY_GAME_RULES or ALL)`);
	if (!['none', 'death', 'all'].includes(subscriptions)) throw new Error(`${name}: invalid subscriptions`);
	if (names.has(name)) throw new Error(`Duplicate case name: ${name}`);
	names.add(name);
	return { name, runtime, entry, method, mode, subscriptions };
});
const child = fileURLToPath(new URL('./benchmark-run.ts', import.meta.url));
const measurements = ['ms', 'rssMiB', 'peakRssMiB', 'heapMiB'];
const counts = ['tick', 'entities', 'deaths'];
const runs = [];
let seed = 0x5eed;
// Sequential child processes avoid contention; a fixed shuffle avoids ordering bias.
for (let repeat = 0; repeat < repeats; repeat++) {
	const order = [...cases];
	for (let i = order.length - 1; i > 0; i--) {
		seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
		const j = seed % (i + 1);
		[order[i], order[j]] = [order[j], order[i]];
	}
	for (const c of order) {
		const result = spawnSync(c.runtime, [child, demo, c.method, c.mode], {
			encoding: 'utf8',
			timeout: 300000,
			env: { ...process.env, CS2_PARSER_ENTRY: c.entry, CS2_BENCH_SUBSCRIPTIONS: c.subscriptions }
		});
		if (result.error || result.status !== 0) {
			throw new Error(
				`${c.name}: ${result.error ?? (result.stderr || result.stdout || `exit ${result.status}, signal ${result.signal}`)}`
			);
		}
		const metrics = JSON.parse(result.stdout.trim());
		// Average rates per run, not the reciprocal of the average duration.
		const throughputMBps = stat.size / (metrics?.ms * 1000);
		if (
			measurements.some(k => !Number.isFinite(metrics?.[k]) || metrics[k] < 0) ||
			metrics.ms <= 0 ||
			!Number.isFinite(throughputMBps) ||
			counts.some(k => !Number.isSafeInteger(metrics?.[k]) || (k !== 'tick' && metrics[k] < 0))
		) {
			throw new Error(`${c.name}: invalid or nonfinite metrics`);
		}
		runs.push({ ...metrics, throughputMBps, name: c.name, repeat });
		console.log(
			`${repeat + 1}/${repeats} ${c.name}: ${throughputMBps.toFixed(1)} MB/s | ${metrics.ms.toFixed(1)} ms`
		);
	}
}
const stats = values => {
	const sorted = values.sort((a, b) => a - b);
	const mid = Math.floor(sorted.length / 2);
	return {
		mean: sorted.reduce((sum, n) => sum + n / sorted.length, 0),
		median: sorted.length % 2 ? sorted[mid] : sorted[mid - 1] / 2 + sorted[mid] / 2,
		min: sorted[0],
		max: sorted.at(-1)
	};
};
const summary = cases.map(c => {
	const samples = runs.filter(r => r.name === c.name);
	if (counts.some(k => new Set(samples.map(r => r[k])).size !== 1)) throw new Error(`Unstable output: ${c.name}`);
	return {
		name: c.name,
		...Object.fromEntries(['throughputMBps', ...measurements].map(k => [k, stats(samples.map(r => r[k]))])),
		...Object.fromEntries(counts.map(k => [k, samples[0][k]]))
	};
});
if (new Set(summary.map(s => s.tick)).size !== 1) throw new Error('Inconsistent final ticks across cases');
for (const mode of modes) {
	const entities = summary.filter((_, i) => cases[i].mode === mode).map(s => s.entities);
	if (new Set(entities).size > 1) throw new Error(`Inconsistent entity counts for ${mode}`);
}
const result = {
	date: new Date().toISOString(),
	demo: resolve(demo),
	platform: process.platform,
	arch: process.arch,
	cpu: cpus()[0]?.model ?? 'unknown',
	bytes: stat.size,
	seed: 0x5eed,
	cases,
	repeats,
	summary,
	runs
};
const cell = value =>
	String(value)
		.replaceAll('|', '\\|')
		.replace(/[\r\n]/g, ' ');
const markdown = [
	'# Benchmark Results',
	'',
	`Demo: ${cell(basename(demo))} (${(stat.size / 1024 ** 2).toFixed(2)} MiB); ${repeats} runs/case; final tick: ${summary[0].tick}.`,
	`CPU: ${cell(result.cpu)}; ${result.platform}/${result.arch}; ${result.date}.`,
	'',
	'Times include input I/O, exclude imports/setup; OS cache is not reset. Sequential shuffled runs, seed 0x5eed.',
	'Throughput: mean / **median**, higher is better; 1 MB = 1,000,000 bytes. Other columns show medians; full mean/min/max statistics are available with `--json`.',
	'Memory is process-wide; peak RSS includes imports/setup.',
	'`path-sync` uses `stream: false` (larger 4 MiB reads), not synchronous parsing.',
	'',
	'| Case | Throughput (MB/s) | Time (ms) | RSS (MiB) | Peak RSS (MiB) | Heap (MiB) | Entities |',
	'| --- | ---: | ---: | ---: | ---: | ---: | ---: |',
	...summary.map(
		s =>
			`| ${cell(s.name)} | ${s.throughputMBps.mean.toFixed(1)} / **${s.throughputMBps.median.toFixed(1)}** | ${measurements.map(k => s[k].median.toFixed(1)).join(' | ')} | ${s.entities} |`
	),
	'',
	'### Case Configuration',
	'',
	'| Case | Runtime | Entry | Method | Mode | Subscriptions |',
	'| --- | --- | --- | --- | --- | --- |',
	...cases.map(c => `| ${Object.values(c).map(cell).join(' | ')} |`),
	''
].join('\n');
console.log(markdown);
if (options.has('--json')) writeFileSync(options.get('--json'), JSON.stringify(result, null, 2) + '\n');
if (options.has('--markdown')) writeFileSync(options.get('--markdown'), markdown);

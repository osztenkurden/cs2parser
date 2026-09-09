import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { cpus } from 'node:os';
import { fileURLToPath } from 'node:url';

// Cases: [{ name, runtime, entry, method, mode, subscriptions? }]. Entries must be
// equivalent builds; timings include warm-cache input I/O but exclude imports.
const [demo, casesPath, output, repeatArg = '5'] = process.argv.slice(2);
if (!demo || !casesPath || !output) {
	throw new Error('Usage: node scripts/benchmark-compare.mjs DEMO CASES.json RESULTS.json [REPEATS]');
}
const config = JSON.parse(readFileSync(casesPath, 'utf8'));
const cases = config?.cases ?? config;
const repeats = Number(repeatArg);
if (!Number.isInteger(repeats) || repeats < 1 || !Array.isArray(cases) || !cases.length) {
	throw new Error('Expected nonempty cases and a positive repeat count');
}
const child = fileURLToPath(new URL('./benchmark-run.ts', import.meta.url));
const runs = [];
let seed = 0x5eed;
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
			env: { ...process.env, CS2_PARSER_ENTRY: c.entry, CS2_BENCH_SUBSCRIPTIONS: c.subscriptions ?? 'death' }
		});
		if (result.error || result.status !== 0) {
			throw new Error(`${c.name}: ${result.error ?? result.stderr ?? result.stdout}`);
		}
		const metrics = JSON.parse(result.stdout.trim());
		runs.push({ name: c.name, repeat, ...metrics });
		console.log(`${repeat + 1}/${repeats} ${c.name}: ${metrics.ms.toFixed(1)} ms`);
	}
}
const median = values => {
	const sorted = values.toSorted((a, b) => a - b);
	const mid = Math.floor(sorted.length / 2);
	return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};
const summary = cases.map(c => {
	const samples = runs.filter(r => r.name === c.name);
	const ticks = new Set(samples.map(r => r.tick));
	const entities = new Set(samples.map(r => r.entities));
	const deaths = new Set(samples.map(r => r.deaths));
	if (ticks.size !== 1 || entities.size !== 1 || deaths.size !== 1) throw new Error(`Unstable output: ${c.name}`);
	return {
		name: c.name,
		ms: median(samples.map(r => r.ms)),
		minMs: Math.min(...samples.map(r => r.ms)),
		maxMs: Math.max(...samples.map(r => r.ms)),
		rssMiB: median(samples.map(r => r.rssMiB)),
		peakRssMiB: median(samples.map(r => r.peakRssMiB)),
		tick: samples[0].tick,
		entities: samples[0].entities,
		deaths: samples[0].deaths
	};
});
writeFileSync(
	output,
	JSON.stringify(
		{
			date: new Date().toISOString(),
			platform: process.platform,
			arch: process.arch,
			cpu: cpus()[0]?.model,
			bytes: statSync(demo).size,
			cases,
			repeats,
			summary,
			runs
		},
		null,
		2
	) + '\n'
);
console.table(summary);

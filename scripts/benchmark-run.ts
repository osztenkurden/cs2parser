import fs from 'node:fs';

const [demoPath, method, mode] = process.argv.slice(2);
if (process.argv.length !== 5 || !demoPath?.trim()) throw new Error('Expected DEMO METHOD MODE');
if (!['path-stream', 'path-sync', 'buffer', 'stream', 'web-stream'].includes(method ?? '')) {
	throw new Error(`Unknown parse method: ${method}`);
}
if (!mode || !['NONE', 'ONLY_GAME_RULES', 'ALL'].includes(mode)) throw new Error(`Unknown entity mode: ${mode}`);
const subscriptions = process.env.CS2_BENCH_SUBSCRIPTIONS ?? 'none';
if (!['none', 'death', 'all'].includes(subscriptions)) throw new Error(`Unknown subscriptions: ${subscriptions}`);
// Explicit built entries allow comparisons across revisions without timing imports.
const entry = process.env.CS2_PARSER_ENTRY ?? 'cs2parser';
if (!entry.trim() || /[\0\r\n]/.test(entry)) throw new Error('Invalid parser entry');
const { DemoReader, EntityMode } = await import(entry);
if (typeof DemoReader !== 'function' || !Number.isFinite(EntityMode?.[mode])) {
	throw new Error(`Invalid parser entry (expected DemoReader and EntityMode.${mode}): ${entry}`);
}
const entityMode = EntityMode[mode];

const p = new DemoReader();
let completed = false;
let deaths = 0;
if (subscriptions !== 'none') p.gameEvents.on('player_death', () => deaths++);
if (subscriptions === 'all') {
	p.on('anymessage', () => {});
	p.on('usercommand', () => {});
	p.gameEvents.on('gameEvent', () => {});
}
p.on('error', () => {}); // the end payload carries the failure for validation below
p.on('end', (end: { incomplete: boolean; error?: unknown }) => {
	completed = end.incomplete === false && !end.error;
});
const start = performance.now();

switch (method) {
	case 'path-stream':
		await p.parseDemo(demoPath, { entities: entityMode });
		break;
	case 'path-sync':
		// This selects larger streamed reads, not synchronous parsing.
		await p.parseDemo(demoPath, { entities: entityMode, stream: false });
		break;
	case 'buffer':
		await p.parseDemo(fs.readFileSync(demoPath), { entities: entityMode });
		break;
	case 'stream':
		await p.parseDemo(fs.createReadStream(demoPath), { entities: entityMode });
		break;
	case 'web-stream': {
		const source = fs.createReadStream(demoPath);
		const iterator = source[Symbol.asyncIterator]();
		await p.parseDemo(
			new ReadableStream({
				async pull(controller) {
					const { done, value } = await iterator.next();
					if (done) controller.close();
					else controller.enqueue(value);
				},
				async cancel() {
					source.destroy();
					await iterator.return?.();
				}
			}),
			{ entities: entityMode }
		);
		break;
	}
	default:
		throw new Error(`Unknown parse method: ${method}`);
}

const ms = performance.now() - start;
if (!completed) throw new Error('Benchmark parse failed or was incomplete');
const mem = process.memoryUsage();
const metrics = {
	ms,
	rssMiB: mem.rss / 1024 ** 2,
	peakRssMiB: process.resourceUsage().maxRSS / 1024,
	heapMiB: mem.heapUsed / 1024 ** 2,
	entities: p.entities.filter(Boolean).length,
	tick: p.currentTick,
	deaths
};
if (!Object.values(metrics).every(Number.isFinite)) throw new Error('Nonfinite benchmark metrics');
console.log(JSON.stringify(metrics));

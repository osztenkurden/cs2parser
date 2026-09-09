import fs from 'fs';
// An explicit built entry lets the same child benchmark compare revisions and runtimes.
const { DemoReader, EntityMode } = await import(
	process.env.CS2_PARSER_ENTRY ?? new URL('../src/index.js', import.meta.url).href
);

const demoPath = process.argv[2]!;
const method = process.argv[3]!;
const entityMode =
	process.argv[4] === 'ALL'
		? EntityMode.ALL
		: process.argv[4] === 'ONLY_GAME_RULES'
			? EntityMode.ONLY_GAME_RULES
			: EntityMode.NONE;

const p = new DemoReader();
let completed = false;
let deaths = 0;
const subscriptions = process.env.CS2_BENCH_SUBSCRIPTIONS ?? 'none';
if (subscriptions !== 'none') p.gameEvents.on('player_death', () => deaths++);
if (subscriptions === 'all') {
	p.on('anymessage', () => {});
	p.on('usercommand', () => {});
	p.gameEvents.on('gameEvent', () => {});
}
p.on('error', () => {}); // the end payload carries the failure for validation below
p.on('end', (end: { incomplete: boolean; error?: unknown }) => {
	completed = !end.incomplete && !end.error;
});
const start = performance.now();

switch (method) {
	case 'path-stream':
		await p.parseDemo(demoPath, { entities: entityMode });
		break;
	case 'path-sync':
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
console.log(
	JSON.stringify({
		time: (ms / 1000).toFixed(1) + 's',
		ms,
		rssMiB: mem.rss / 1024 / 1024,
		peakRssMiB: process.resourceUsage().maxRSS / 1024,
		heapMiB: mem.heapUsed / 1024 / 1024,
		rss: (mem.rss / 1024 / 1024).toFixed(0) + 'MB',
		heap: (mem.heapUsed / 1024 / 1024).toFixed(0) + 'MB',
		entities: p.entities.filter(Boolean).length,
		tick: p.currentTick,
		deaths
	})
);

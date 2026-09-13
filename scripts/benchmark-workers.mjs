// Experimental aggregate analysis, not a replacement for ordered live callbacks.
// Usage: bun scripts/benchmark-workers.mjs DEMO [workers=2] [static|batched|dynamic] [shared|clone|transfer] [index|prepared|discover] [rounds=1]
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { canonicalize } from '../tests/helpers/parity.ts';
import { prepareWorkerCheckpoints } from './worker-checkpoints.ts';

if (!process.versions.bun) throw new Error('This benchmark requires Bun and the Web Workers API');
const [demo, countArg = '2', scheduling = 'static', storage = 'shared', setup = 'index', roundsArg = '1'] =
	process.argv.slice(2);
const count = Number(countArg);
const rounds = Number(roundsArg);
if (
	!demo ||
	!Number.isSafeInteger(count) ||
	count < 1 ||
	count > 16 ||
	!['static', 'batched', 'dynamic'].includes(scheduling) ||
	!['shared', 'clone', 'transfer'].includes(storage) ||
	!['discover', 'index', 'prepared'].includes(setup) ||
	!Number.isSafeInteger(rounds) ||
	rounds < 1 ||
	rounds > 100
)
	throw new Error(
		'Expected DEMO [workers=2, 1..16] [static|batched|dynamic] [shared|clone|transfer] [index|prepared|discover] [rounds=1, 1..100]'
	);
const entry = process.env.CS2_PARSER_ENTRY ?? 'cs2parser';
const { DemoReader, EntityMode } = await import(entry);
const bytes = readFileSync(demo);
assert.equal(bytes.toString('ascii', 0, 8), 'PBDEMS2\0');
let pos = 16,
	maxTick = 0;
const boundaries = [{ tick: 0, offset: 16 }];
const seekIndex = {};
const metadataFrames = [];
let firstFullPacket = true;
const varint = () => {
	let value = 0;
	for (let shift = 0; shift < 35; shift += 7) {
		const byte = bytes[pos++];
		if (byte === undefined || (shift === 28 && byte > 15)) throw new Error('Invalid frame varint');
		value |= (byte & 127) << shift;
		if (!(byte & 128)) return value >>> 0;
	}
	throw new Error('Invalid frame varint');
};
while (pos < bytes.length) {
	const offset = pos;
	const commandBase = varint();
	const command = commandBase & ~64,
		tick = varint(),
		size = varint();
	if (tick !== 0xffffffff) maxTick = Math.max(maxTick, tick);
	// Own complete ticks: restore a FullPacket and its tick silently in the next
	// range, rather than splitting same-tick commands or delivering them twice.
	if (command === 13 && tick > 0 && tick !== 0xffffffff && boundaries.at(-1).tick !== tick + 1)
		boundaries.push({ tick: tick + 1, offset: pos });
	if (command === 13) seekIndex[tick === 0xffffffff ? -1 : tick] = offset;
	if (command === 13 || (firstFullPacket && [1, 4, 5, 7, 8].includes(command)))
		metadataFrames.push({ offset, end: pos + size, commandBase, headerSize: pos - offset });
	if (command === 13) firstFullPacket = false;
	pos += size;
	assert(pos <= bytes.length, 'Truncated demo');
}
if (boundaries.at(-1).tick === maxTick + 1) boundaries.pop();
boundaries.push({ tick: maxTick + 1, offset: bytes.length });
let cuts = boundaries;
if (scheduling === 'static' && boundaries.length > 2) {
	cuts = [boundaries[0]];
	for (let i = 1; i < count; i++) {
		const desired = (bytes.length * i) / count;
		const found = boundaries
			.slice(1, -1)
			.reduce((best, b) => (Math.abs(b.offset - desired) < Math.abs(best.offset - desired) ? b : best));
		if (found.tick > cuts.at(-1).tick) cuts.push(found);
	}
	cuts.push(boundaries.at(-1));
}
if (scheduling === 'batched') cuts = boundaries.filter((_, i) => i % 8 === 0 || i === boundaries.length - 1);
const jobs = cuts.slice(0, -1).map((cut, id) => ({ id, start: cut.tick, end: cuts[id + 1].tick }));
const workerCount = Math.min(count, jobs.length);
console.log({
	runtime: `Bun ${process.versions.bun}`,
	workerCount,
	scheduling,
	storage,
	setup,
	rounds,
	bytes: bytes.length,
	jobs: jobs.length
});
if (storage !== 'shared') console.warn('Full-demo clone/transfer variants can exhaust memory; shared is recommended.');

// The reference does the same aggregate/hash work. File I/O and header indexing
// are outside both timers; worker startup, staging, seeking and messaging are timed.
const reference = [];
const reader = new DemoReader();
let ticks = 0,
	events = 0,
	deaths = 0,
	index = 0;
let hash = createHash('sha256');
reader.on('gameevent', payload => {
	events++;
	hash.update(canonicalize({ tick: reader.currentTick, payload }));
});
reader.gameEvents.on('player_death', () => deaths++);
reader.on('tickend', tick => {
	ticks++;
	if (tick >= jobs[index].end - 1) {
		reference.push({
			...jobs[index],
			ticks,
			events,
			deaths,
			hash: hash.digest('hex'),
			entities: createHash('sha256')
				.update(canonicalize(reader.entities.flatMap((v, id) => (v ? [{ id, ...v }] : []))))
				.digest('hex')
		});
		ticks = events = deaths = 0;
		hash = createHash('sha256');
		index++;
	}
});
const baselineStart = performance.now();
assert.deepEqual(await reader.parseDemo(bytes, { entities: EntityMode.ALL }), { status: 'complete' });
const baselineMs = performance.now() - baselineStart;
const started = performance.now();
const locations = Object.entries(seekIndex).sort(([a], [b]) => Number(a) - Number(b));
const checkpointOffsets = jobs.map(job => locations.findLast(([tick]) => Number(tick) < job.start)?.[1]);
const prepared =
	setup === 'prepared'
		? prepareWorkerCheckpoints(
				DemoReader,
				bytes,
				metadataFrames,
				new Set(checkpointOffsets.filter(offset => offset !== undefined))
			)
		: undefined;
const preparationMs = performance.now() - started;
let input = bytes;
if (storage === 'shared') {
	input = new Uint8Array(new SharedArrayBuffer(bytes.length));
	input.set(bytes);
}
let next = 0,
	done = 0,
	ready = 0,
	deadline;
let round = 0,
	roundStarted = started;
const samples = [];
const results = [],
	workers = [];
try {
	await new Promise((resolve, reject) => {
		deadline = setTimeout(() => reject(new Error('Worker deadline exceeded (90 seconds)')), 90000);
		const dispatch = worker => {
			const job = jobs[next++];
			if (job)
				worker.postMessage({ type: 'job', job, checkpoint: prepared?.checkpoints[checkpointOffsets[job.id]] });
		};
		for (let i = 0; i < workerCount; i++) {
			const worker = new Worker(new URL('./benchmark-worker.mjs', import.meta.url).href);
			workers.push(worker);
			worker.onerror = event => reject(new Error(event.message));
			worker.onmessage = ({ data }) => {
				if (data.type === 'error') reject(new Error(`${data.error}\n${data.stack}`));
				if (data.type === 'ready' && ++ready === workerCount)
					for (const available of workers) dispatch(available);
				if (data.type === 'result') {
					results.push(data.result);
					if (++done === jobs.length) {
						const elapsed = performance.now() - roundStarted;
						results.sort((a, b) => a.id - b.id);
						try {
							for (let j = 0; j < results.length; j++) {
								const { seekMs, ms, ...actual } = results[j];
								assert.deepEqual(actual, reference[j], `Round ${round} interval ${j} differs`);
							}
						} catch (error) {
							reject(error);
							return;
						}
						samples.push({ ms: elapsed, seekMs: results.reduce((sum, result) => sum + result.seekMs, 0) });
						console.log(
							`Round ${round + 1}/${rounds}: ${elapsed.toFixed(1)} ms; ${jobs.length} verified intervals`
						);
						if (++round === rounds) resolve();
						else {
							next = done = 0;
							results.length = 0;
							roundStarted = performance.now();
							clearTimeout(deadline);
							deadline = setTimeout(
								() => reject(new Error('Worker round deadline exceeded (90 seconds)')),
								90000
							);
							for (const available of workers) dispatch(available);
						}
					} else dispatch(worker);
				}
			};
			if (storage === 'transfer') {
				const copy = Uint8Array.from(bytes);
				worker.postMessage(
					{
						type: 'init',
						bytes: copy,
						entry,
						index: setup === 'discover' ? undefined : seekIndex,
						schema: prepared?.schema
					},
					[copy.buffer]
				);
			} else
				worker.postMessage({
					type: 'init',
					bytes: input,
					entry,
					index: setup === 'discover' ? undefined : seekIndex,
					schema: prepared?.schema
				});
		}
	});
	const ms = samples.reduce((sum, sample) => sum + sample.ms, 0) / samples.length;
	console.log(
		JSON.stringify({
			workerCount,
			scheduling,
			storage,
			setup,
			preparationMs,
			samples,
			baselineMs,
			ms,
			speedup: baselineMs / ms,
			peakRssMiB: process.resourceUsage().maxRSS / 1024,
			verified: true
		})
	);
} finally {
	clearTimeout(deadline);
	for (const worker of workers) worker.terminate();
}

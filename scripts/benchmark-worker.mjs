// Bun Web Worker for benchmark-workers.mjs, not a public parser transport.
import { createHash } from 'node:crypto';
import { canonicalize } from '../tests/helpers/parity.ts';

let reader, parsing, active, finish;
let ticks = 0,
	events = 0,
	deaths = 0;
let hash = createHash('sha256');

self.onmessage = async ({ data }) => {
	try {
		if (data.type === 'init') {
			const { DemoReader, EntityMode } = await import(data.entry);
			reader = new DemoReader();
			reader.on('tickend', tick => {
				if (!active) return;
				if (tick >= active.start && tick < active.end) ticks++;
				if (tick >= active.end - 1) void reader.pause().then(() => finish?.());
			});
			reader.on('gameevent', payload => {
				if (!active || reader.currentTick < active.start || reader.currentTick >= active.end) return;
				events++;
				hash.update(canonicalize({ tick: reader.currentTick, payload }));
			});
			reader.gameEvents.on('player_death', () => {
				if (active) deaths++;
			});
			parsing = reader.parseDemo(data.bytes, { entities: EntityMode.ALL });
			void parsing.catch(() => {});
			await reader.pause();
			self.postMessage({ type: 'ready' });
		} else if (data.type === 'job') {
			const job = data.job;
			const started = performance.now();
			// Adjacent jobs can resume directly; stolen jobs reconstruct their metadata
			// and FullPacket state using the same validated seek path as applications.
			if (reader.currentTick + 1 !== job.start || reader.currentTick < 0) {
				const seek = await reader.seekTo(job.start);
				if (seek.status !== 'complete') throw new Error(`Seek failed: ${JSON.stringify(seek)}`);
			}
			const seekMs = performance.now() - started;
			ticks = events = deaths = 0;
			hash = createHash('sha256');
			active = job;
			const paused = new Promise(resolve => {
				finish = resolve;
			});
			reader.resume();
			await Promise.race([
				paused,
				parsing.then(() => {
					throw new Error('Parser ended before interval boundary');
				})
			]);
			active = undefined;
			const entities = reader.entities.flatMap((value, id) => (value ? [{ id, ...value }] : []));
			self.postMessage({
				type: 'result',
				result: {
					...job,
					ticks,
					events,
					deaths,
					hash: hash.digest('hex'),
					entities: createHash('sha256').update(canonicalize(entities)).digest('hex'),
					seekMs,
					ms: performance.now() - started
				}
			});
		}
	} catch (error) {
		self.postMessage({ type: 'error', error: String(error), stack: error?.stack });
	}
};

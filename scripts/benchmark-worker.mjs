// Bun Web Worker for benchmark-workers.mjs, not a public parser transport.
import { createHash } from 'node:crypto';
import { canonicalize } from '../tests/helpers/parity.ts';

let reader, parsing, active, finish, fail, schema;
let ticks = 0,
	events = 0,
	deaths = 0;
let hash = createHash('sha256');

self.onmessage = async ({ data }) => {
	try {
		if (data.type === 'init') {
			const { DemoReader, EntityMode } = await import(data.entry);
			reader = new DemoReader();
			if (data.index) reader.setSeekIndex(data.index);
			if (data.schema) {
				const constructors = new Map(
					[
						Uint8Array,
						Uint16Array,
						Uint32Array,
						Int8Array,
						Int16Array,
						Int32Array,
						Float32Array,
						BigUint64Array,
						BigInt64Array
					].map(ctor => [ctor.name, ctor])
				);
				schema = data.schema;
				for (const info of schema.propInfoById)
					if (info?.elementCtor) {
						const ctor = constructors.get(info.elementCtor);
						if (!ctor) throw new Error('Unsupported checkpoint container');
						info.elementCtor = ctor;
					}
				schema.propIdToInfo = Object.fromEntries(
					schema.propInfoById.flatMap((info, id) => (info ? [[id, info]] : []))
				);
			}
			reader.on('tickend', tick => {
				if (!active) return;
				if (tick >= active.start && tick < active.end) ticks++;
				if (tick >= active.end - 1)
					void reader.pause().then(
						() => finish?.(),
						error => fail?.(error)
					);
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
			void parsing.then(
				() => fail?.(new Error('Parser ended before interval boundary')),
				error => fail?.(error)
			);
			await reader.pause();
			self.postMessage({ type: 'ready' });
		} else if (data.type === 'job') {
			const job = data.job;
			const started = performance.now();
			if (data.checkpoint) {
				if (data.checkpoint.memoryBytes > 32 * 1024 * 1024)
					throw new Error('Checkpoint exceeds seek metadata budget');
				// Experimental benchmark-only handoff, deliberately not a public API.
				// Seed the same metadata path used by seekTo, retaining its snapshot validation.
				reader._seekSession.seed = { ...data.checkpoint.state, classInfo: schema };
				reader._seekSession.seedBytes = data.checkpoint.memoryBytes;
			}
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
			const paused = new Promise((resolve, reject) => {
				finish = resolve;
				fail = reject;
			});
			reader.resume();
			await paused;
			finish = fail = undefined;
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

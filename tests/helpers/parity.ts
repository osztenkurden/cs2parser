/** Test-only, runtime-independent snapshot format. Changing it requires reviewing the master golden. */
export const PARITY_TICKS = [1, 1024, 16384, 32768, 65536, 98304, 131072, 163840, 180000] as const;
export const PARITY_CHUNK_SIZES = [4093, 64 * 1024, 1024 * 1024] as const;
export const PARITY_MODES = ['NONE', 'ONLY_GAME_RULES', 'ALL'] as const;
export type ParityMode = (typeof PARITY_MODES)[number];

/** Tagged values avoid collisions with user data, including objects that resemble our tags. */
export function canonicalize(value: unknown): string {
	const ancestors = new Set<object>();
	const visit = (value: unknown): unknown => {
		if (value === null) return ['null'];
		switch (typeof value) {
			case 'undefined':
				return ['undefined'];
			case 'boolean':
			case 'string':
				return [typeof value, value];
			case 'bigint':
				return ['bigint', String(value)];
			case 'number':
				return ['number', Object.is(value, -0) ? '-0' : Number.isFinite(value) ? value : String(value)];
			case 'object':
				break;
			default:
				throw new TypeError(`Unsupported parity value: ${typeof value}`);
		}
		if (ancestors.has(value)) throw new TypeError('Cyclic parity value; snapshot data, not parser helpers');
		ancestors.add(value);
		try {
			if (Array.isArray(value)) {
				return [
					'array',
					Array.from({ length: value.length }, (_, i) =>
						Object.hasOwn(value, i) ? visit(value[i]) : ['hole']
					)
				];
			}
			if (ArrayBuffer.isView(value)) {
				// Buffer's intrinsic tag is Uint8Array. Do not use its constructor name or toJSON().
				const type = Object.prototype.toString.call(value).slice(8, -1);
				const elements =
					type === 'DataView'
						? new Uint8Array(value.buffer, value.byteOffset, value.byteLength)
						: (value as unknown as ArrayLike<number | bigint>);
				return ['view', type, Array.from(elements, visit)];
			}
			if (value instanceof ArrayBuffer) return ['ArrayBuffer', Array.from(new Uint8Array(value), visit)];
			if (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null) {
				throw new TypeError('Unsupported parity object; project helpers to plain data');
			}
			if (Object.getOwnPropertySymbols(value).length) throw new TypeError('Unsupported parity symbol keys');
			return [
				'object',
				Object.keys(value)
					.sort()
					.map(key => [key, visit((value as Record<string, unknown>)[key])])
			];
		} finally {
			ancestors.delete(value);
		}
	};
	return JSON.stringify(visit(value));
}

export async function sha256(text: string): Promise<string> {
	const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
	return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

/** Structural interface also accepts the untouched pre-browser master reader. No Node imports. */
interface ParityReader {
	readonly currentTick: number;
	readonly header: unknown;
	readonly entities: readonly ({ className: string } | undefined)[];
	readonly players: readonly unknown[];
	on(event: 'tickend', listener: (tick: number) => void): unknown;
	on(event: 'gameevent', listener: (payload: unknown) => void): unknown;
	readonly gameEvents: {
		on(event: 'round_start' | 'round_end', listener: (payload: unknown) => void): unknown;
	};
}

interface Snapshot {
	tick: number;
	entities: { count: number; sha256: string };
	gameRules: { count: number; sha256: string };
	players: { count: number; sha256: string };
}

export interface ParityResult {
	headerSha256: string;
	tickCount: number;
	checkpoints: Snapshot[];
	final: Snapshot;
	rawGameEvents: { count: number; sha256: string };
	syntheticRoundEvents: { starts: number; ends: number; sha256: string };
}

/** Attach before parsing. Capture is synchronous; finish() hashes only immutable strings after parsing. */
export function captureParity(reader: ParityReader, mode: ParityMode, ticks: readonly number[] = PARITY_TICKS) {
	const selected = new Set(ticks);
	const rawEvents: string[] = [];
	const rounds: string[] = [];
	let starts = 0;
	let ends = 0;
	let tickCount = 0;
	const snapshot = (tick: number) => {
		const entities = reader.entities.flatMap((entity, id) => (entity ? [{ id, ...entity }] : []));
		const gameRules = entities.filter(entity => entity.className === 'CCSGameRulesProxy');
		return {
			tick,
			entities: { count: entities.length, text: canonicalize(entities) },
			gameRules: { count: gameRules.length, text: canonicalize(gameRules) },
			players: { count: reader.players.filter(Boolean).length, text: canonicalize(reader.players) }
		};
	};
	const checkpoints: ReturnType<typeof snapshot>[] = [];
	reader.on('tickend', tick => {
		tickCount++;
		if (selected.has(tick)) checkpoints.push(snapshot(tick));
	});
	reader.on('gameevent', payload => rawEvents.push(canonicalize({ tick: reader.currentTick, payload })));
	if (mode !== 'NONE') {
		for (const name of ['round_start', 'round_end'] as const) {
			reader.gameEvents.on(name, data => {
				const event = data as Record<string, unknown>;
				// Only wire/synthetic payload fields, never Player/Team helpers with back-references.
				const fields =
					name === 'round_start'
						? ['event_name', 'timelimit', 'fraglimit', 'objective']
						: ['event_name', 'winner', 'reason', 'message', 'legacy', 'player_count', 'nomusic'];
				const payload = Object.fromEntries(fields.map(key => [key, event[key]]));
				rounds.push(canonicalize({ tick: reader.currentTick, name, payload }));
				if (name === 'round_start') starts++;
				else ends++;
			});
		}
	}
	return {
		finish(): Promise<ParityResult> {
			// Capture before the first await: entities and protobuf byte views may be reused/mutated.
			const final = snapshot(reader.currentTick);
			const header = canonicalize(reader.header);
			const rawText = `["array",[${rawEvents.join(',')}]]`;
			const roundText = `["array",[${rounds.join(',')}]]`;
			const counts = { tickCount, raw: rawEvents.length, starts, ends };
			const hashSnapshot = async (state: ReturnType<typeof snapshot>): Promise<Snapshot> => ({
				tick: state.tick,
				entities: { count: state.entities.count, sha256: await sha256(state.entities.text) },
				gameRules: { count: state.gameRules.count, sha256: await sha256(state.gameRules.text) },
				players: { count: state.players.count, sha256: await sha256(state.players.text) }
			});
			return (async () => ({
				headerSha256: await sha256(header),
				tickCount: counts.tickCount,
				checkpoints: await Promise.all(checkpoints.map(hashSnapshot)),
				final: await hashSnapshot(final),
				rawGameEvents: { count: counts.raw, sha256: await sha256(rawText) },
				syntheticRoundEvents: { starts: counts.starts, ends: counts.ends, sha256: await sha256(roundText) }
			}))();
		}
	};
}

/** Split the magic/header into single bytes, then use unaligned small, normal, or large chunks. */
export function chunkedDemo(bytes: Uint8Array, chunkSize: number): ReadableStream<Uint8Array> {
	if (!Number.isSafeInteger(chunkSize) || chunkSize <= 0) throw new RangeError('Invalid demo chunk size');
	let offset = 0;
	return new ReadableStream<Uint8Array>({
		pull(controller) {
			if (offset === bytes.length) return controller.close();
			const end = Math.min(bytes.length, offset + (offset < 32 ? 1 : chunkSize));
			controller.enqueue(bytes.subarray(offset, end));
			offset = end;
		}
	});
}

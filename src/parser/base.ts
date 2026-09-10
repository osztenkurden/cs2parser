import { TypedEventEmitter, type EmitterMetaEvents } from './descriptors/typedEmitter.js';
import type { SnappyDecoder } from '../compression/types.js';
import type { CDemoFileHeader } from '../ts-proto/demo.js';
import { GameEvents } from './descriptors/gameEventEmitter.js';
import { CMsgPlayerInfo } from '../ts-proto/networkbasetypes.js';
import {
	EntityMode,
	type EmitQueue,
	type OutputEvents,
	type ParseOutcome,
	type BroadcastOutcome
} from './entities/types.js';
import { asError } from './errors.js';
import type { Decoder, PropInfo } from './entities/constructorFields.js';
import { ParseSession, type ParseSessionOptions } from './entities/parseSession.js';
import { applyPropUpdate } from './entities/entityParser.js';
import { Player } from '../helpers/player.js';
import { Team } from '../helpers/team.js';
import { GameRules } from '../helpers/gameRules.js';
import type { AnyEntity, EntityProperties, KnownClassName, ICCSPlayerController } from '../generated/entityTypes.js';
import { isEntityClass } from '../generated/entityTypes.js';
import { PlayerPawn } from '../helpers/playerPawn.js';
import { SmokeHelper } from '../helpers/smoke.js';
import {
	messageRegistry,
	onDemandMessageNames,
	CORE_HANDLED_IDS,
	type OnDemandMessageName
} from './descriptors/index.js';
import { HttpBroadcastReader, type HttpBroadcastOptions } from '../broadcast/httpReader.js';

/** Lower 32 bits of a SteamID64 — i.e. the trailing number in SteamID3 form. */
const steamIdToAccountId = (steamId: bigint | number): number => {
	const big = typeof steamId === 'bigint' ? steamId : BigInt(steamId);
	return Number(big & 0xffffffffn);
};

export type DemoInput = Uint8Array | ReadableStream<Uint8Array>;
export type ParseOptions = { entities?: EntityMode } & ParseSessionOptions;
interface DemoStreamReader {
	read(): Promise<{ done?: boolean; value?: Uint8Array }>;
	cancel(reason?: unknown): Promise<unknown>;
	releaseLock?(): void;
}

/** Runtime-independent parsing, entities, events, and broadcast support. */
export abstract class BaseDemoReader extends TypedEventEmitter<
	{
		[K in keyof OutputEvents]: OutputEvents[K] extends never ? [] : [OutputEvents[K]];
	} & EmitterMetaEvents
> {
	_parseStartTime = 0;
	header: CDemoFileHeader | null = null;
	private _hasEnded = false;
	private _endResult!: OutputEvents['end'];
	private _reader: DemoStreamReader | null = null;
	private _parsing = false;
	private _cancelBroadcast: (() => void) | undefined;
	private _failure: { cause: unknown } | undefined;
	private _cleanupBroadcast: (() => void) | undefined;

	entities: AnyEntity[];
	private _directWriteMode = false;
	private tickInterval = NaN;
	currentTick = -1;

	private _playerInfoMap: (CMsgPlayerInfo | undefined)[] = [];

	private _playerCache: Map<number, Player> = new Map();
	private _teamCache: Map<number, Team> = new Map();
	private _pawnCache: Map<number, PlayerPawn> = new Map();
	private _smokeCache: Map<number, SmokeHelper> = new Map();
	private _gameRulesCache: GameRules | null = null;
	private _accountIdToEntityId: Map<number, number> = new Map();

	gameEvents = new GameEvents();

	/**
	 * Bumped whenever a listener is added or removed. The parse session watches it
	 * to know when to recompute which network messages anyone is subscribed to, so
	 * a listener attached mid-parse takes effect from the next packet.
	 * @internal
	 */
	_listenerEpoch = 0;

	/** Every network message that can be listened to by name. */
	static readonly messageNames: readonly OnDemandMessageName[] = onDemandMessageNames;

	/** Wire id for a network message name, or undefined if the name isn't a message. */
	static messageId(name: string): number | undefined {
		return (messageRegistry as Record<string, { id: number } | undefined>)[name]?.id;
	}

	/** True if `name` is a network message that can be subscribed to by name. */
	static isMessageName(name: string): name is OnDemandMessageName {
		return (
			Object.hasOwn(messageRegistry, name) &&
			!CORE_HANDLED_IDS.has(messageRegistry[name as keyof typeof messageRegistry].id)
		);
	}

	get currentTime(): number {
		return this.currentTick * this.tickInterval;
	}
	/** All players from the userinfo string table. Available even with EntityMode.NONE. */
	get players() {
		return this._playerInfoMap;
	}

	/** True once a terminal `'end'` event has been observed (parse finished, errored, or cancelled). */
	get hasEnded(): boolean {
		return this._hasEnded;
	}

	private _getOrCreate<T>(cache: Map<number, T>, id: number, factory: (id: number) => T): T {
		let cached = cache.get(id);
		if (!cached) {
			cached = factory(id);
			cache.set(id, cached);
		}
		return cached;
	}

	/** Get a Player helper by controller entity ID. Requires EntityMode.ALL. */
	getPlayer(entityId: number): Player | null {
		const e = this.entities[entityId];
		if (e && e.className === 'CCSPlayerController') {
			return this._getOrCreate(this._playerCache, entityId, id => new Player(this, id));
		}
		return null;
	}

	/** Get a human, bot, or TV controller by zero-based player slot. Requires EntityMode.ALL. */
	getPlayerBySlot(slot: number): Player | null {
		if (!Number.isInteger(slot) || slot < 0 || slot >= 0xff) return null;
		return this.getPlayer(slot + 1);
	}

	getPawn(entityId: number): PlayerPawn | null {
		const e = this.entities[entityId];
		if (e && e.className === 'CCSPlayerPawn') {
			return this._getOrCreate(this._pawnCache, entityId, id => new PlayerPawn(this, id));
		}
		return null;
	}

	/** Get a SmokeHelper by smoke-grenade-projectile entity ID. Requires EntityMode.ALL. */
	getSmoke(entityId: number): SmokeHelper | null {
		const e = this.entities[entityId];
		if (e && e.className === 'CSmokeGrenadeProjectile') {
			return this._getOrCreate(this._smokeCache, entityId, id => new SmokeHelper(this, id));
		}
		return null;
	}

	/** All currently-active smoke clouds as SmokeHelper objects. Requires EntityMode.ALL. */
	get smokes(): SmokeHelper[] {
		const result: SmokeHelper[] = [];
		for (let i = 0; i < this.entities.length; i++) {
			const e = this.entities[i];
			if (e && e.className === 'CSmokeGrenadeProjectile') {
				result.push(this._getOrCreate(this._smokeCache, i, id => new SmokeHelper(this, id)));
			}
		}
		return result;
	}

	/** All player controller entities as Player helpers. Requires EntityMode.ALL. */
	get playerControllers(): Player[] {
		const result: Player[] = [];
		for (let i = 0; i < this.entities.length; i++) {
			const e = this.entities[i];
			if (e && e.className === 'CCSPlayerController') {
				result.push(this._getOrCreate(this._playerCache, i, id => new Player(this, id)));
			}
		}
		return result;
	}

	/**
	 * Get a Player helper for a given CMsgPlayerInfo (e.g. an element from `parser.players`).
	 * Uses the player slot and verifies the full userid against the current roster, so
	 * an old entry cannot resolve to a replacement connection. Supports bots and TV.
	 * SteamID-only inputs retain the SteamID scan fallback. Requires EntityMode.ALL.
	 */
	getPlayerByInfo(info: CMsgPlayerInfo | null | undefined): Player | null {
		if (!info) return null;
		if (info.userid !== undefined) {
			if (!Number.isInteger(info.userid) || info.userid < 0) return null;
			const slot = info.userid & 0xff;
			if (this._playerInfoMap[slot]?.userid !== info.userid) return null;
			return this.getPlayerBySlot(slot);
		}
		if (info.steamid === undefined) return null;
		const target = String(info.steamid);
		if (target === '0') return null;
		for (let i = 0; i < this.entities.length; i++) {
			const e = this.entities[i];
			if (!e || e.className !== 'CCSPlayerController') continue;
			const raw = (e.properties as Partial<ICCSPlayerController>)['CCSPlayerController.m_steamID'];
			if (raw !== undefined && String(raw) === target) {
				return this._getOrCreate(this._playerCache, i, id => new Player(this, id));
			}
		}
		return null;
	}

	/**
	 * Get a Player helper by Steam account ID — the lower 32 bits of the SteamID64,
	 * i.e. the trailing number in SteamID3 form (e.g. `918429678` from `[U:1:918429678]`).
	 * Requires EntityMode.ALL. O(1) on cached entries, with a linear-scan fallback for
	 * controllers whose `m_steamID` was set after entity creation.
	 */
	getByAccountId(accountId: number): Player | null {
		// Zero is shared by bots and TV; it cannot identify a player.
		if (!Number.isInteger(accountId) || accountId <= 0 || accountId > 0xffffffff) return null;
		// Fast path: cached entityId. Validate against the live entity in case the slot
		// was deleted, reused, or the controller's steamID changed.
		const cached = this._accountIdToEntityId.get(accountId);
		if (cached !== undefined) {
			const e = this.entities[cached];
			if (e && e.className === 'CCSPlayerController') {
				const raw = (e.properties as Partial<ICCSPlayerController>)['CCSPlayerController.m_steamID'];
				if (raw !== undefined && steamIdToAccountId(raw) === accountId) {
					return this._getOrCreate(this._playerCache, cached, id => new Player(this, id));
				}
			}
			this._accountIdToEntityId.delete(accountId);
		}

		// Fallback: linear scan. Re-populates the map for any controller that was
		// missing m_steamID at entitycreated time.
		for (let i = 0; i < this.entities.length; i++) {
			const e = this.entities[i];
			if (!e || e.className !== 'CCSPlayerController') continue;
			const raw = (e.properties as Partial<ICCSPlayerController>)['CCSPlayerController.m_steamID'];
			if (raw === undefined) continue;
			const id = steamIdToAccountId(raw);
			if (id === 0) continue;
			this._accountIdToEntityId.set(id, i);
			if (id === accountId) {
				return this._getOrCreate(this._playerCache, i, id => new Player(this, id));
			}
		}
		return null;
	}

	/** All team entities as Team helper objects */
	get teams(): Team[] {
		const result: Team[] = [];
		for (let i = 0; i < this.entities.length; i++) {
			const e = this.entities[i];
			if (e && e.className === 'CCSTeam') {
				const t = this._getOrCreate(this._teamCache, i, id => new Team(this, id));
				result[t.teamNumber] = t;
			}
		}
		return result;
	}

	private _gameRulesEntityId: number | null = null;

	/** Game rules helper (or null if not yet created) */
	get gameRules(): GameRules | null {
		if (this._gameRulesEntityId === null) return null;
		const e = this.entities[this._gameRulesEntityId];
		if (!e) {
			this._gameRulesEntityId = null;
			this._gameRulesCache = null;
			return null;
		}
		if (!this._gameRulesCache) {
			this._gameRulesCache = new GameRules(this, this._gameRulesEntityId);
		}
		return this._gameRulesCache;
	}

	/** Get a typed entity by index and class name. Returns typed properties or undefined. */
	getEntity<T extends KnownClassName>(entityId: number, className: T): EntityProperties<T> | undefined {
		const e = this.entities[entityId];
		if (isEntityClass(e, className)) {
			return e.properties as EntityProperties<T>;
		}
		return undefined;
	}

	/** Find all entities of a specific class, with typed properties */
	findEntities<T extends KnownClassName>(className: T): { entityId: number; properties: EntityProperties<T> }[] {
		const result: { entityId: number; properties: EntityProperties<T> }[] = [];
		for (let i = 0; i < this.entities.length; i++) {
			const e = this.entities[i];
			if (isEntityClass(e, className)) {
				result.push({ entityId: i, properties: e.properties as EntityProperties<T> });
			}
		}
		return result;
	}

	/** Re-exported type guard for narrowing entities */
	static isEntityClass = isEntityClass;

	protected constructor(readonly _snappy: SnappyDecoder) {
		super();
		this.on('newListener', () => {
			this._listenerEpoch++;
		});
		this.on('removeListener', () => {
			this._listenerEpoch++;
		});
		this.entities = [];
		this.gameEvents.listen(this);

		this.on('tickstart', tick => {
			this.currentTick = tick;
		});
		this.on('createstringtable', table => {
			if (!table) return;

			for (const player of table.players) {
				if (player.userid === undefined || player.userid < 0 || (player.userid & 255) === 255) continue;
				this._playerInfoMap[player.userid & 255] = player;
			}
		});
		this.on('updatestringtable', update => {
			if (!update) return;
			for (const player of update.players) {
				if (player.userid === undefined || player.userid < 0 || (player.userid & 255) === 255) continue;
				this._playerInfoMap[player.userid & 255] = player;
			}
		});
		this.on('clearallstringtables', () => {
			this._playerInfoMap.length = 0;
		});

		this.on('entitycreated', ([entityId, classId, entityType, className]) => {
			this._playerCache.delete(entityId);
			this._teamCache.delete(entityId);
			this._pawnCache.delete(entityId);
			if (className === 'CCSGameRulesProxy') {
				this._gameRulesEntityId = entityId;
				this._gameRulesCache = null;
			}
			if (className === 'CCSPlayerController') {
				// In direct-write mode, baseline + initial-update properties are written
				// before this listener fires (queue is flushed after the packet), so
				// m_steamID is already populated for most controllers.
				const e = this.entities[entityId];
				const raw = (e?.properties as Partial<ICCSPlayerController> | undefined)?.[
					'CCSPlayerController.m_steamID'
				];
				if (raw !== undefined) {
					const accountId = steamIdToAccountId(raw);
					if (accountId !== 0) this._accountIdToEntityId.set(accountId, entityId);
				}
			}
			if (this._directWriteMode) return;
			this.entities[entityId] = {
				classId,
				entityType,
				className,
				properties: {}
			};
		});

		this.on('entityupdated', info => {
			if (this._directWriteMode) return;
			const ent = this.entities[info.entityId];
			if (!ent) return;
			const meta = this.propIdToInfo[info.propId];
			if (meta === undefined) return;
			applyPropUpdate(
				ent.properties as Record<string, unknown>,
				meta,
				info.value,
				info.arrayIndex ?? -1,
				info.isResize ?? false
			);
		});

		this.on('entitydeleted', entityId => {
			if (entityId === this._gameRulesEntityId) {
				this._gameRulesEntityId = null;
				this._gameRulesCache = null;
			}
			this._playerCache.delete(entityId);
			this._teamCache.delete(entityId);
			this._pawnCache.delete(entityId);
			this._smokeCache.delete(entityId);
			if (this._directWriteMode) return;
			this.entities[entityId] = undefined as any;
		});
		this.once('header', header => {
			this.header = header;
		});
		this.once('serverinfo', serverInfo => {
			if (serverInfo.tick_interval !== undefined) {
				this.tickInterval = serverInfo.tick_interval;
			}
		});
	}

	propIdToName: Record<number, string> = {};
	propIdToDecoder: Record<number, Decoder> = {};
	propIdToInfo: Record<number, PropInfo> = {};

	private _emitQueue: EmitQueue = queue => {
		try {
			for (const element of queue) {
				if (this._hasEnded) break;
				if (element[0] === 'end') this._end(element[1]);
				else this.emit(element[0], element[1] as any);
			}
		} catch (cause) {
			this._fail(cause);
			throw cause;
		} finally {
			queue.length = 0;
		}
	};

	/** @internal Commit terminal state before notifying application listeners. */
	_end(result: OutputEvents['end']): void {
		if (this._endResult !== undefined) return;
		this._endResult = result;
		this._hasEnded = true;
		this._parsing = false;
		this._directWriteMode = false;
		this._cancelBroadcast = undefined;
		try {
			this._cleanupBroadcast?.();
		} finally {
			this._cleanupBroadcast = undefined;
			this._snappy.release?.();
		}
		if (result.status === 'error') {
			// Diagnostics cannot replace the primary failure or prevent the end notification.
			try {
				if (this.listenerCount('error')) this.emit('error', { error: result.error });
			} catch {
				/* First error wins. */
			}
			try {
				this.emit('end', result);
			} catch {
				/* First error wins. */
			}
			return;
		}
		try {
			this.emit('end', result);
			if (this._failure) return;
			this.emit(
				'debug',
				`[${this.currentTick}] Parsed demo in ${Math.round(performance.now() - this._parseStartTime)}ms`
			);
		} catch (cause) {
			this._failure ??= { cause };
			throw cause;
		}
	}

	/** @internal Also propagates exceptions from cancellation during a pending read/fetch. */
	_throwFailure(): void {
		if (this._failure) throw this._failure.cause;
	}

	/** @internal Record the first failure before observational notifications. */
	_fail(cause: unknown): void {
		this._failure ??= { cause };
		try {
			this._end({ status: 'error', error: this._failure.cause });
		} catch {
			/* Cleanup/notification failures must not replace the primary failure. */
		}
	}

	protected assertCanParse(opts: ParseOptions) {
		if (this._hasEnded) throw new Error('Demo has already been parsed');
		if (this._parsing) throw new Error('Demo parsing is already in progress');
		ParseSession.validateOptions(opts?.entities ?? EntityMode.NONE, opts);
	}

	/** Parse bytes or a Web Stream. The parser takes ownership of the stream. */
	async parseDemo(source: DemoInput, opts: ParseOptions = {}): Promise<ParseOutcome> {
		this.assertCanParse(opts);
		if (!(source instanceof Uint8Array) && (source == null || typeof source.getReader !== 'function')) {
			throw new TypeError('Expected a Uint8Array or ReadableStream<Uint8Array>');
		}
		return this.parseSource(source instanceof Uint8Array ? source : () => source.getReader(), opts);
	}

	/** Runtime adapters supply a reader directly, without an extra Web Stream queue. */
	protected parseSource(source: Uint8Array | (() => DemoStreamReader), opts: ParseOptions) {
		this.assertCanParse(opts);
		this._parsing = true;
		this._parseStartTime = performance.now();
		return this._parse(source, opts);
	}

	private async _parse(source: Uint8Array | (() => DemoStreamReader), opts: ParseOptions): Promise<ParseOutcome> {
		const entityMode = opts.entities ?? EntityMode.NONE;
		this._directWriteMode = true;
		this.gameEvents.entityMode = entityMode;
		let reachedEOF = false;
		try {
			let initial: Uint8Array;
			let readNextChunk: (() => Promise<Uint8Array | null>) | undefined;
			if (source instanceof Uint8Array) {
				initial = source;
			} else {
				const reader = source();
				this._reader = reader;
				readNextChunk = async () => {
					while (!this._hasEnded) {
						const { done, value } = await reader.read();
						if (done) {
							reachedEOF = true;
							return null;
						}
						if (!(value instanceof Uint8Array))
							throw new TypeError('Demo stream chunks must be Uint8Array');
						if (value.length) return value;
					}
					return null;
				};
				// Only the prefix needs collecting; the session handles split frames.
				initial = new Uint8Array(0);
				while (initial.length < 16 && !this._hasEnded) {
					const chunk = await readNextChunk();
					if (chunk === null) break;
					if (initial.length === 0) initial = chunk;
					else {
						const joined = new Uint8Array(initial.length + chunk.length);
						joined.set(initial);
						joined.set(chunk, initial.length);
						initial = joined;
					}
				}
			}
			if (!this._hasEnded) {
				if (initial.length < 16) this._end({ status: 'incomplete' });
				else await new ParseSession(initial, entityMode, this._emitQueue, this, opts).runAsync(readNextChunk);
			}
		} catch (cause) {
			if (!this._hasEnded) this._fail(asError(cause));
			else if (this._endResult?.status !== 'cancelled') this._fail(cause);
		} finally {
			const reader = this._reader;
			this._reader = null;
			if (reader) {
				try {
					if (!reachedEOF) await reader.cancel();
				} catch {
					/* Keep the original parse result. */
				}
				try {
					reader.releaseLock?.();
				} catch {
					/* Keep the original result or callback exception. */
				}
			}
			this._directWriteMode = false;
			this._parsing = false;
		}
		this._throwFailure();
		return this._endResult as ParseOutcome;
	}

	public cancel() {
		if (this._hasEnded) throw new Error('Demo has already been parsed');
		this._hasEnded = true;
		// cancel() settles a pending read immediately, unlike merely releasing its lock.
		void this._reader?.cancel(new Error('Demo parsing cancelled')).catch(() => {});
		const cancelBroadcast = this._cancelBroadcast;
		let failure: { cause: unknown } | undefined;
		try {
			this.emit('cancel');
		} catch (cause) {
			failure = { cause };
			this._failure ??= failure;
		}
		try {
			cancelBroadcast?.();
		} catch (cause) {
			failure ??= { cause };
		}
		try {
			this._end({ status: 'cancelled' });
		} catch (cause) {
			failure ??= { cause };
		}
		if (failure) {
			this._failure ??= failure;
			throw failure.cause;
		}
	}

	/**
	 * Parse a live CS2 GOTV HTTP broadcast. Convenience wrapper around
	 * {@link HttpBroadcastReader}. Resolves when the broadcast ends or is
	 * cancelled; throws if the broadcast terminates with an error.
	 *
	 * For finer-grained control (live `sync`/`fragment`/`tailTick` inspection,
	 * separate start/run, stop), construct `HttpBroadcastReader` directly.
	 *
	 * @example
	 * await parser.parseHttpBroadcast('https://relay.example.com/match/', {
	 *   entities: EntityMode.ALL
	 * });
	 */
	async parseHttpBroadcast(baseUrl: string, opts: HttpBroadcastOptions = {}): Promise<BroadcastOutcome> {
		const reader = new HttpBroadcastReader(this, baseUrl, opts);
		const outcome = await reader.start();
		return outcome.status === 'ready' ? reader.run() : outcome;
	}

	/**
	 * @internal Used by HttpBroadcastReader to wire a broadcast-mode ParseSession
	 * to the parser's emit queue and direct-write entity tracking. Throws if a
	 * previous parse already ended on this DemoReader.
	 */
	_attachBroadcastSession(
		opts: { entities?: EntityMode } & ParseSessionOptions = {},
		onCancel?: () => void,
		onEnd?: () => void
	): ParseSession {
		this.assertCanParse(opts);
		const entityMode = opts.entities ?? EntityMode.NONE;
		const session = ParseSession.forBroadcast(entityMode, this._emitQueue, this, opts);
		this._parsing = true;
		this._cancelBroadcast = onCancel;
		this._cleanupBroadcast = onEnd;
		this._parseStartTime = performance.now();
		this._directWriteMode = true;
		this.gameEvents.entityMode = entityMode;
		return session;
	}
}

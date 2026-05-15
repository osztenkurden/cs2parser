import fs from 'fs';
import { type CDemoFileHeader, EDemoCommands } from '../ts-proto/demo.js';
import { decoders } from './descriptors/decoders.js';
import { BitBuffer } from './ubitreader.js';
import { GameEvents } from './descriptors/gameEventEmitter.js';
import { CMsgPlayerInfo } from '../ts-proto/networkbasetypes.js';
import { type Readable } from 'stream';
import { EntityMode, type EmitQueue, type OutputEvents } from './entities/types.js';
import type { Decoder } from './entities/constructorFields.js';
import { ParseSession, type ParseSettings } from './entities/parseSession.js';
import { Player } from '../helpers/player.js';
import snappy from 'snappy';
import { Team } from '../helpers/team.js';
import { GameRules } from '../helpers/gameRules.js';
import type { EntityProperties, KnownClassName } from '../generated/entityTypes.js';
import EventEmitter from 'events';
import { PlayerPawn } from '../helpers/playerPawn.js';
import { SVC_Messages } from '../ts-proto/netmessages.js';
import { messages } from './descriptors/index.js';
import { HttpBroadcastReader, type HttpBroadcastOptions } from '../broadcast/httpReader.js';
import { native } from '../native/index.js';

/** Lower 32 bits of a SteamID64 — i.e. the trailing number in SteamID3 form. */
const steamIdToAccountId = (steamId: bigint | number): number => {
	const big = typeof steamId === 'bigint' ? steamId : BigInt(steamId);
	return Number(big & 0xffffffffn);
};

export class DemoReader extends EventEmitter<{
	[K in keyof OutputEvents]: OutputEvents[K] extends never ? [] : [OutputEvents[K]];
}> {
	_parseStartTime = 0n;
	header: CDemoFileHeader | null = null;
	private _hasEnded = false;
	private _stream: Readable | null = null;

	private tickInterval = NaN;
	currentTick = -1;
	private _directWriteMode = false; // legacy, retained for ParseSession internals

	private _playerInfoMap: (CMsgPlayerInfo | undefined)[] = [];

	private _playerCache: Map<number, Player> = new Map();
	private _teamCache: Map<number, Team> = new Map();
	private _pawnCache: Map<number, PlayerPawn> = new Map();
	private _gameRulesCache: GameRules | null = null;
	private _accountIdToEntityId: Map<number, number> = new Map();

	gameEvents = new GameEvents();

	/**
	 * Reverse lookup populated from `propIdToName` after `init_class_info`.
	 * Helpers and the v2 getter API use this to translate fully-qualified
	 * property names ("CCSPlayerController.m_iKills") into the integer
	 * `prop_id` that the Rust decoder uses as its storage key.
	 *
	 * @internal — public for ParseSession to populate.
	 */
	_propIdByName: Map<string, number> = new Map();

	/**
	 * The active Rust decoder handle for the current parse. Populated by
	 * `ParseSession` after `DEM_ClassInfo` arrives; used by the v2 getter
	 * methods on `DemoReader` and (Stage 2+) by the helpers.
	 *
	 * @internal
	 */
	_native: InstanceType<typeof native.EntityDecoderNative> | null = null;

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
		if (this.getEntityClassName(entityId) === 'CCSPlayerController') {
			return this._getOrCreate(this._playerCache, entityId, id => new Player(this, id));
		}
		return null;
	}

	getPawn(entityId: number): PlayerPawn | null {
		if (this.getEntityClassName(entityId) === 'CCSPlayerPawn') {
			return this._getOrCreate(this._pawnCache, entityId, id => new PlayerPawn(this, id));
		}
		return null;
	}

	/** All player controller entities as Player helpers. Requires EntityMode.ALL. */
	get playerControllers(): Player[] {
		return this.findEntityIdsByClass('CCSPlayerController').map(id =>
			this._getOrCreate(this._playerCache, id, eid => new Player(this, eid))
		);
	}

	/**
	 * Get a Player helper for a given CMsgPlayerInfo (e.g. an element from `parser.players`).
	 * Matches by steamid against CCSPlayerController.m_steamID. Requires EntityMode.ALL.
	 *
	 * Returns null if:
	 *   - info is null/undefined or has no steamid
	 *   - info is a bot (steamid === '0') — bots share steamid '0' and cannot be uniquely matched
	 *   - the player has not yet been assigned a controller entity
	 *   - the player has disconnected and the controller has been removed
	 */
	getPlayerByInfo(info: CMsgPlayerInfo | null | undefined): Player | null {
		if (!info || info.steamid === undefined) return null;
		const target = String(info.steamid);
		if (target === '0') return null;
		for (const id of this.findEntityIdsByClass('CCSPlayerController')) {
			const raw = this.getBigIntProp(id, 'CCSPlayerController.m_steamID');
			if (raw !== undefined && String(raw) === target) {
				return this._getOrCreate(this._playerCache, id, eid => new Player(this, eid));
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
		const cached = this._accountIdToEntityId.get(accountId);
		if (cached !== undefined) {
			if (this.getEntityClassName(cached) === 'CCSPlayerController') {
				const raw = this.getBigIntProp(cached, 'CCSPlayerController.m_steamID');
				if (raw !== undefined && steamIdToAccountId(raw) === accountId) {
					return this._getOrCreate(this._playerCache, cached, eid => new Player(this, eid));
				}
			}
			this._accountIdToEntityId.delete(accountId);
		}
		for (const id of this.findEntityIdsByClass('CCSPlayerController')) {
			const raw = this.getBigIntProp(id, 'CCSPlayerController.m_steamID');
			if (raw === undefined) continue;
			const accId = steamIdToAccountId(raw);
			this._accountIdToEntityId.set(accId, id);
			if (accId === accountId) {
				return this._getOrCreate(this._playerCache, id, eid => new Player(this, eid));
			}
		}
		return null;
	}

	/** All team entities as Team helper objects, indexed by `teamNumber`. */
	get teams(): Team[] {
		const result: Team[] = [];
		for (const id of this.findEntityIdsByClass('CCSTeam')) {
			const t = this._getOrCreate(this._teamCache, id, eid => new Team(this, eid));
			result[t.teamNumber] = t;
		}
		return result;
	}

	private _gameRulesEntityId: number | null = null;

	/** Game rules helper (or null if not yet created). */
	get gameRules(): GameRules | null {
		if (this._gameRulesEntityId === null) return null;
		if (!this.getEntityClassName(this._gameRulesEntityId)) {
			this._gameRulesEntityId = null;
			this._gameRulesCache = null;
			return null;
		}
		if (!this._gameRulesCache) {
			this._gameRulesCache = new GameRules(this, this._gameRulesEntityId);
		}
		return this._gameRulesCache;
	}

	/**
	 * v2: returns a fresh snapshot of an entity's properties, keyed by name.
	 * Slower than the per-property getters (one FFI per prop on the entity);
	 * callers that read many properties on hot paths should prefer the typed
	 * getters (`getNumberProp`, etc.) directly.
	 *
	 * Returns `undefined` if no entity exists at `entityId`, or if `className`
	 * is supplied and doesn't match.
	 */
	getEntity<T extends KnownClassName>(entityId: number, className?: T): EntityProperties<T> | undefined {
		const actual = this.getEntityClassName(entityId);
		if (!actual) return undefined;
		if (className !== undefined && actual !== className) return undefined;
		return this._buildPropertySnapshot(entityId) as EntityProperties<T>;
	}

	/** v2: find ids by class + build a snapshot per id. */
	findEntities<T extends KnownClassName>(className: T): { entityId: number; properties: EntityProperties<T> }[] {
		return this.findEntityIdsByClass(className).map(entityId => ({
			entityId,
			properties: this._buildPropertySnapshot(entityId) as EntityProperties<T>
		}));
	}

	private _buildPropertySnapshot(entityId: number): Record<string, unknown> {
		if (!this._native) return {};
		const propIds = this._native.getEntityPropIds(entityId) ?? [];
		const out: Record<string, unknown> = {};
		for (const propId of propIds) {
			const name = this.propIdToName[propId];
			if (!name) continue;
			// One typed read in priority order; matches the variant that's actually stored.
			const num = this._native.getPropertyNumber(entityId, propId);
			if (num !== null && num !== undefined) {
				// Bool kind stored as 0/1 — recover the boolean via a second probe.
				const asBool = this._native.getPropertyBool(entityId, propId);
				out[name] = asBool !== null && asBool !== undefined ? asBool : num;
				continue;
			}
			const s = this._native.getPropertyString(entityId, propId);
			if (s !== null && s !== undefined) {
				out[name] = s;
				continue;
			}
			const v3 = this._native.getPropertyVec3(entityId, propId);
			if (v3 !== null && v3 !== undefined) {
				out[name] = Array.from(v3);
				continue;
			}
			const big = this._native.getPropertyBigint(entityId, propId);
			if (big !== null && big !== undefined) {
				out[name] = big;
				continue;
			}
			const blob = this._native.getPropertyBlob(entityId, propId);
			if (blob !== null && blob !== undefined) {
				out[name] = blob;
				continue;
			}
		}
		return out;
	}

	// ─── v2 getter API (Rust-resident state) ──────────────────────────────
	// Added alongside the existing `entities` array. Reads come from the Rust
	// decoder's internal storage — no JS-side object materialisation.

	/**
	 * Look up a property's `prop_id` by its fully-qualified name
	 * ("CCSPlayerController.m_iKills"). Cached on the DemoReader after
	 * classInfo init; one Map probe per call.
	 */
	getPropId(name: string): number | undefined {
		return this._propIdByName.get(name);
	}

	/**
	 * Read a number-typed property (bool widened to 0/1, i32/u32/f32 widened
	 * to JS number). Returns `undefined` if the entity / prop is unset, the
	 * name doesn't resolve, or the stored value isn't number-shaped.
	 */
	getNumberProp(entityId: number, name: string): number | undefined {
		const id = this._propIdByName.get(name);
		if (id === undefined || !this._native) return undefined;
		return this._native.getPropertyNumber(entityId, id) ?? undefined;
	}

	getStringProp(entityId: number, name: string): string | undefined {
		const id = this._propIdByName.get(name);
		if (id === undefined || !this._native) return undefined;
		return this._native.getPropertyString(entityId, id) ?? undefined;
	}

	getVec3Prop(entityId: number, name: string): Float64Array | undefined {
		const id = this._propIdByName.get(name);
		if (id === undefined || !this._native) return undefined;
		return this._native.getPropertyVec3(entityId, id) ?? undefined;
	}

	getBigIntProp(entityId: number, name: string): bigint | undefined {
		const id = this._propIdByName.get(name);
		if (id === undefined || !this._native) return undefined;
		return this._native.getPropertyBigint(entityId, id) ?? undefined;
	}

	getBoolProp(entityId: number, name: string): boolean | undefined {
		const id = this._propIdByName.get(name);
		if (id === undefined || !this._native) return undefined;
		return this._native.getPropertyBool(entityId, id) ?? undefined;
	}

	getBlobProp(entityId: number, name: string): Uint8Array | undefined {
		const id = this._propIdByName.get(name);
		if (id === undefined || !this._native) return undefined;
		return this._native.getPropertyBlob(entityId, id) ?? undefined;
	}

	/** Class name of the live entity at `entityId`, or `undefined`. */
	getEntityClassName(entityId: number): string | undefined {
		return this._native?.getEntityClassName(entityId) ?? undefined;
	}

	/** All live entity ids. Snapshot at call time. */
	getEntityIds(): number[] {
		return this._native?.getEntityIds() ?? [];
	}

	/** Entity ids whose class name matches `className` exactly. */
	findEntityIdsByClass<T extends string>(className: T): number[] {
		return this._native?.findEntityIdsByClass(className) ?? [];
	}

	constructor() {
		super();
		this.gameEvents.listen(this);
		this.on('end', () => {
			this._hasEnded = true;
			this.emit(
				'debug',
				`[${this.currentTick}] Parsed demo in ${(process.hrtime.bigint() - this._parseStartTime) / 10n ** 6n}ms`
			);
		});

		this.on('tickstart', tick => {
			this.currentTick = tick;
		});
		this.on('createstringtable', table => {
			if (!table) return;

			for (const player of table.players) {
				this._playerInfoMap[player.userid! & 255] = player;
			}
		});
		this.on('updatestringtable', update => {
			if (!update) return;
			for (const player of update.players) {
				if (player.userid === undefined) continue;
				this._playerInfoMap[player.userid & 255] = player;
			}
		});

		this.on('entitycreated', ([entityId, _classId, _entityType, className]) => {
			this._playerCache.delete(entityId);
			this._teamCache.delete(entityId);
			this._pawnCache.delete(entityId);
			if (className === 'CCSGameRulesProxy') {
				this._gameRulesEntityId = entityId;
				this._gameRulesCache = null;
			}
			if (className === 'CCSPlayerController') {
				// Properties are already written into Rust-resident state before
				// the 'entitycreated' event reaches us (baseline + initial delta run
				// inside `parse_entity_packet`), so the steamID is readable here.
				const raw = this.getBigIntProp(entityId, 'CCSPlayerController.m_steamID');
				if (raw !== undefined) {
					const accountId = steamIdToAccountId(raw);
					if (accountId !== 0) this._accountIdToEntityId.set(accountId, entityId);
				}
			}
		});

		this.on('entitydeleted', entityId => {
			if (entityId === this._gameRulesEntityId) {
				this._gameRulesEntityId = null;
				this._gameRulesCache = null;
			}
			this._playerCache.delete(entityId);
			this._teamCache.delete(entityId);
			this._pawnCache.delete(entityId);
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

	static parseServerInfo = (filePath: string) => {
		const max = fs.statSync(filePath).size;
		const bufferSize = Math.min(4096 * 8, max - 16);

		const fd = fs.openSync(filePath, 'r');
		try {
			const buffer = Buffer.alloc(bufferSize);

			fs.readSync(fd, buffer, 0, bufferSize, 16);

			const byteBuffer = new BitBuffer(buffer);

			const EDemoCommandTypeBase = byteBuffer.ReadUVarInt32();
			const type = EDemoCommandTypeBase & ~EDemoCommands.DEM_IsCompressed;

			if (type !== EDemoCommands.DEM_FileHeader) return null;

			let tick = byteBuffer.ReadUVarInt32(); // TICK

			const size = byteBuffer.ReadUVarInt32();

			byteBuffer.skipBytesBetter(size);
			const _frameBuffer = Buffer.alloc(32 * 1024);
			while (tick === 0xffffffff && byteBuffer.RemainingBytes > 0) {
				const EDemoCommandTypeBase = byteBuffer.ReadUVarInt32();
				const type = EDemoCommandTypeBase & ~EDemoCommands.DEM_IsCompressed;
				tick = byteBuffer.ReadUVarInt32(); // TICK
				const size = byteBuffer.ReadUVarInt32();

				const decoder = decoders[type as keyof typeof decoders];
				if (
					!decoder ||
					!(decoder.type === EDemoCommands.DEM_Packet || decoder.type === EDemoCommands.DEM_SignonPacket)
				) {
					byteBuffer.skipBytesBetter(size);
					continue;
				}

				const frameBuffer = byteBuffer.readBytesToSlice(_frameBuffer, size);

				const isCompressed = (EDemoCommandTypeBase & EDemoCommands.DEM_IsCompressed) !== 0;
				const bytes = isCompressed ? (snappy.uncompressSync(frameBuffer) as Buffer) : frameBuffer;

				const data = decoder.decode(bytes);
				if (!data.data) continue;
				const reader = new BitBuffer(data.data!);
				while (reader.RemainingBits > 8) {
					const cmd = reader.readUbitVar();
					const size = reader.ReadUVarInt32();
					if (cmd !== SVC_Messages.svc_ServerInfo) {
						reader.skipBytesBetter(size);
						continue;
					}
					const serverInfo = Buffer.alloc(size);
					const slice = reader.readBytesToSlice(serverInfo, size);
					return messages[SVC_Messages.svc_ServerInfo].class.decode(slice);
				}
			}
			return null;
		} finally {
			fs.closeSync(fd);
		}
	};

	static parseHeader = (filePath: string) => {
		const bufferSize = 4096;

		const fd = fs.openSync(filePath, 'r');
		try {
			const buffer = Buffer.alloc(bufferSize);

			fs.readSync(fd, buffer, 0, bufferSize, 16);

			const byteBuffer = new BitBuffer(buffer);

			const EDemoCommandTypeBase = byteBuffer.ReadUVarInt32();
			const type = EDemoCommandTypeBase & ~EDemoCommands.DEM_IsCompressed;

			if (type !== EDemoCommands.DEM_FileHeader) return null;

			byteBuffer.ReadUVarInt32(); // TICK
			const size = byteBuffer.ReadUVarInt32();
			const headerBuffer = Buffer.alloc(size);
			byteBuffer.readBytes(headerBuffer);
			const data = decoders[EDemoCommands.DEM_FileHeader].decode(headerBuffer);
			return data;
		} finally {
			fs.closeSync(fd);
		}
	};

	propIdToName: Record<number, string> = {};
	propIdToDecoder: Record<number, Decoder> = {};

	private _emitQueue: EmitQueue = queue => {
		if (this._hasEnded) return;
		for (const element of queue) {
			if (this._hasEnded) return;
			this.emit(element[0], element[1] as any);
		}
		queue.length = 0;
	};

	/** Non-blocking parse from a pre-loaded Buffer. */
	private async _parseBuffer(buffer: Buffer, opts: { entities?: EntityMode } & ParseSettings = {}) {
		const entityMode = opts.entities ?? EntityMode.NONE;
		this._directWriteMode = true;
		this.gameEvents.entityMode = entityMode;
		await new ParseSession(buffer, entityMode, this._emitQueue, this, opts).runAsync();
		this._directWriteMode = false;
		this._hasEnded = true;
	}

	/** Non-blocking parse from a file path using chunked reads (low memory). */
	private async _parseFile(filePath: string, opts: { entities?: EntityMode } & ParseSettings = {}) {
		const entityMode = opts.entities ?? EntityMode.NONE;
		this._directWriteMode = true;
		this.gameEvents.entityMode = entityMode;
		await ParseSession.fromFile(filePath, entityMode, this._emitQueue, this, opts).runAsync();
		this._directWriteMode = false;
		this._hasEnded = true;
	}

	/** Core streaming parse from a Readable. */
	private _parseStream(stream: Readable, opts: { entities?: EntityMode } & ParseSettings = {}): Promise<void> {
		const entityMode = opts.entities ?? EntityMode.NONE;
		this._stream = stream;
		this._directWriteMode = true;
		this.gameEvents.entityMode = entityMode;

		const { promise, resolve } = Promise.withResolvers<void>();

		let session: ParseSession | null = null;
		let finished = false;
		let pendingChunks: Buffer[] = [];

		const finish = () => {
			finished = true;
			stream.off('data', onData);
			stream.off('error', onError);
			stream.off('end', onEnd);
			this._directWriteMode = false;
			this._hasEnded = true;
		};

		const tryInit = () => {
			const totalPending = pendingChunks.reduce((s, c) => s + c.length, 0);
			if (totalPending < 16) return false;

			session = new ParseSession(Buffer.concat(pendingChunks), entityMode, this._emitQueue, this, opts);
			pendingChunks = [];
			return true;
		};

		const onData = (chunk: Buffer) => {
			if (finished) return;

			if (!session) {
				pendingChunks.push(chunk);
				if (!tryInit()) return;
			} else {
				session.pushChunk(chunk);
			}

			try {
				const more = session!.processFrames();
				if (!more) {
					session!.flush();
					finish();
					resolve();
				}
			} catch (e) {
				finish();
				const error = e instanceof Error ? e : new Error(`Exception during parsing: ${e}`);
				this.emit('end', { error, incomplete: false });
				resolve();
			}
		};

		const onError = (err: Error) => {
			if (finished) return;
			finish();
			this.emit('end', { error: err, incomplete: true });
			resolve();
		};

		const onEnd = () => {
			if (finished) return;
			if (session) {
				try {
					session.processFrames();
				} catch {}
			}
			finish();
			this.emit('end', { incomplete: true });
			resolve();
		};

		stream.on('data', onData);
		stream.on('error', onError);
		stream.on('end', onEnd);

		return promise;
	}

	/**
	 * Parse a CS2 demo file.
	 *
	 * Accepts a file path, a Buffer, or a Readable stream.
	 * File paths stream by default (non-blocking, low memory). Pass `stream: false` to load into memory instead.
	 *
	 * @param opts.entities - Entity parsing mode:
	 *   - `EntityMode.NONE` (default) — skip entity parsing entirely (fastest)
	 *   - `EntityMode.ALL` — parse and track all entities
	 *   - `EntityMode.ONLY_GAME_RULES` — parse entities but only store game rules (enables synthetic round_start/round_end events)
	 *
	 * @example
	 * // File path (streams by default — non-blocking, low memory)
	 * await parser.parseDemo('demo.dem', { entities: EntityMode.ALL });
	 *
	 * // File path with chunked reads (non-blocking, low memory)
	 * await parser.parseDemo('demo.dem', { entities: EntityMode.ALL, stream: false });
	 *
	 * // Readable stream
	 * await parser.parseDemo(createReadStream('demo.dem'), { entities: EntityMode.ALL });
	 *
	 * // Pre-loaded buffer (non-blocking)
	 * await parser.parseDemo(buffer, { entities: EntityMode.ALL });
	 */
	parseDemo(source: Readable, opts?: { entities?: EntityMode } & ParseSettings): Promise<void>;
	parseDemo(source: string, opts: { entities?: EntityMode; stream: false } & ParseSettings): Promise<void>;
	parseDemo(source: string, opts?: { entities?: EntityMode; stream?: true } & ParseSettings): Promise<void>;
	parseDemo(source: Buffer, opts?: { entities?: EntityMode } & ParseSettings): Promise<void>;
	parseDemo(
		source: string | Buffer | Readable,
		opts: { entities?: EntityMode; stream?: boolean } = {}
	): Promise<void> {
		if (this._hasEnded) throw new Error('Demo has already been parsed');
		this._parseStartTime = process.hrtime.bigint();

		if (typeof source === 'string') {
			if (opts.stream === false) {
				return this._parseFile(source, opts);
			}
			return this._parseStream(fs.createReadStream(source), opts);
		}

		if (Buffer.isBuffer(source)) {
			return this._parseBuffer(source, opts);
		}

		return this._parseStream(source, opts);
	}

	public cancel() {
		if (this._hasEnded) throw new Error('Demo has already been parsed');

		this._hasEnded = true;
		this._stream?.destroy(new Error('Stream canceled'));
		this._stream = null;
		this.emit('cancel');
		this.emit('end', { incomplete: true, reason: 'cancelled' });
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
	async parseHttpBroadcast(baseUrl: string, opts: HttpBroadcastOptions = {}): Promise<void> {
		const reader = new HttpBroadcastReader(this, baseUrl, opts);
		await reader.start();
		const terminus = await reader.run();
		if (terminus.reason === 'error') {
			throw terminus.error instanceof Error ? terminus.error : new Error(String(terminus.error));
		}
	}

	/**
	 * @internal Used by HttpBroadcastReader to wire a broadcast-mode ParseSession
	 * to the parser's emit queue and direct-write entity tracking. Throws if a
	 * previous parse already ended on this DemoReader.
	 */
	_attachBroadcastSession(opts: { entities?: EntityMode } & ParseSettings = {}): ParseSession {
		if (this._hasEnded) throw new Error('Demo has already been parsed');
		this._parseStartTime = process.hrtime.bigint();
		const entityMode = opts.entities ?? EntityMode.NONE;
		this._directWriteMode = true;
		this.gameEvents.entityMode = entityMode;
		return ParseSession.forBroadcast(entityMode, this._emitQueue, this, opts);
	}
}

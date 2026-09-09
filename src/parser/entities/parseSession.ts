import { BitBuffer } from '../ubitreader.js';
import { decoders, type DecoderKeys, type Decoders } from '../descriptors/decoders.js';
import { CDemoSendTables, EDemoCommands, type CDemoFullPacket, type CDemoPacket } from '../../ts-proto/demo.js';
import {
	CMsgSource1LegacyGameEvent,
	CMsgSource1LegacyGameEventList,
	EBaseGameEvents
} from '../../ts-proto/gameevents.js';
import {
	CSVCMsg_CreateStringTable,
	CSVCMsg_PacketEntities,
	CSVCMsg_ServerInfo,
	CSVCMsg_UpdateStringTable,
	SVC_Messages,
	type CSVCMsg_UserCommands
} from '../../ts-proto/netmessages.js';
import { messageById, type MessageEntry } from '../descriptors/index.js';
import { applyUserCmdDelta } from './userCmdDelta.js';
import { CSGOUserCmdPB } from '../../ts-proto/cs_usercmd.js';
import { CUserMessageSayText, CUserMessageSayText2, EBaseUserMessages } from '../../ts-proto/usermessages.js';
import {
	applyStringTableSnapshot,
	createStringTable,
	updateStringTable,
	type StringTableObject
} from '../stringtables.js';
import { EntityMode, type EmitQueue, type EventQueue, type OnDemandEvents, type emit } from './types.js';
import { parseClassInfo } from './classInfo.js';
import { EntityParser } from './entityParser.js';
import type { BaseDemoReader as DemoReader } from '../base.js';
import { BinaryReaderEditable } from '../../binary-encoding/index.js';

/**
 * Per-message decode overrides, one optional boolean per network message name.
 *
 * Messages are decoded automatically when something is listening for them, so
 * this is only needed to force a message on with no listener attached, or to
 * force one off that a listener would otherwise enable. Autocomplete lists every
 * name in the generated registry.
 */
export type ParseSettings = {
	[K in keyof OnDemandEvents]?: boolean;
};

/**
 * Events synthesised from one or more network messages, and the message ids they
 * need decoded. Listening for the derived event is enough — the sources turn on
 * with it.
 */
const DERIVED_EVENTS: readonly [event: string, sources: readonly number[]][] = [
	['usercommand', [SVC_Messages.svc_UserCmds]],
	['chat', [EBaseUserMessages.UM_SayText, EBaseUserMessages.UM_SayText2]]
];

// Only outer-frame availability can request a refill. Payload decoder errors are terminal.
const NEED_MORE_INPUT = Symbol('Need more demo input');

export class ParseSession {
	private static readonly CARRY_INITIAL_SIZE = 1 * 1024 * 1024; // 1 MB
	private packetBuffer = new Uint8Array(0);
	private entityBuffer = new Uint8Array(0);
	private readonly gameEventQueue: CMsgSource1LegacyGameEvent[] = [];
	private readonly packetEntitiesQueue: CSVCMsg_PacketEntities[] = [];

	// Buffer state (replaces ByteBuffer for zero-overhead frame reading)
	private _frameBuf: Uint8Array;
	private _frameOffset = 0;
	private _frameLimit = 0;
	private _frameMarked = 0;
	private chunks: Uint8Array[] = [];
	/** Reused contiguous window for stream parsing. See coalesceStream(). */
	private _carry: Uint8Array | null = null;
	/** Trailer subscriptions keep streams open after DEM_Stop until EOF. */
	private _readingTrailer = false;
	private _inputOffset = 0;

	// Parse state
	private entityParser: EntityParser | null = null;
	private sendTables: CDemoSendTables | null = null;
	private readonly baselines: Uint8Array[] = [];
	private currentTick = -1;
	private readonly eventQueue: EventQueue = [];

	// Reusable objects (avoid per-frame allocation)
	private readonly cachedBitBuffer = new BitBuffer(new Uint8Array(0));
	private readonly binaryR = new BinaryReaderEditable(new Uint8Array(0));
	private readonly binaryR2 = new BinaryReaderEditable(new Uint8Array(0));

	// Config (immutable after construction)
	private readonly entityMode: EntityMode;
	private readonly parser: DemoReader;
	private readonly emitMainQueue: EmitQueue;

	private readonly settings: ParseSettings | undefined;

	// Bound reference for EntityParser (avoids .bind() on every call)
	private readonly enqueueEvent: emit = (eventName, data) => {
		this.eventQueue.push([eventName, data] as any);
	};

	private _stringTables: (StringTableObject['table'] | null)[] = [];

	// Subscription state, refreshed once per packet. See refreshSubscriptions().
	private readonly _enabledCache = new Map<string, boolean>();
	private readonly _derivedSources = new Set<number>();
	/** Running CSGOUserCmdPB per player slot — what delta commands are applied to. */
	private readonly _userCmdBaselines: (CSGOUserCmdPB | null)[] = [];
	/** Rejected commands and deltas seen without a valid baseline. */
	private _userCmdRejected = 0;
	private _userCmdDeltasOrphaned = 0;
	private _userCommandsEnabled = false;
	private _enabledEpoch = -1;
	private rawListener = false;

	// Set by forBroadcast(). Disables file/stream entry points and skips the
	// constructor's hardcoded 16-byte magic-prefix offset.
	private _broadcastMode = false;

	/** Frame commands skipped for want of a decoder — reported once each, not per frame. */
	private readonly _unknownFrameCommands = new Set<number>();

	/**
	 * A frame command with no entry in `decoders` is skipped. That is correct for
	 * the ones we knowingly ignore, but it is also how a command Valve added since
	 * the protos were last pulled disappears without trace — so say so once per
	 * command, rather than leaving a silent hole in the stream.
	 */
	private noteUnknownFrameCommand(commandType: number, rawCommand: number, size: number): void {
		if (this._unknownFrameCommands.has(commandType)) return;
		this._unknownFrameCommands.add(commandType);
		this.enqueueEvent(
			'debug',
			`skipping frame command ${commandType} (raw ${rawCommand}, no decoder, first payload ${size} bytes)`
		);
	}

	constructor(
		buffer: Uint8Array,
		entityMode: EntityMode,
		emitMainQueue: EmitQueue,
		parser: DemoReader,
		settings?: ParseSettings
	) {
		this._frameBuf = buffer;
		this._frameOffset = 16; // skip demo file header
		this._frameLimit = buffer.length;
		this.entityMode = entityMode;
		this.parser = parser;
		this.emitMainQueue = emitMainQueue;
		this.settings = settings;
	}

	/**
	 * Create a session for HTTP broadcast parsing. The session has no source
	 * buffer and no file descriptor; commands are fed via
	 * {@link ParseSession.pushBroadcastFragment}.
	 */
	static forBroadcast(
		entityMode: EntityMode,
		emitMainQueue: EmitQueue,
		parser: DemoReader,
		settings?: ParseSettings
	): ParseSession {
		const session = new ParseSession(new Uint8Array(0), entityMode, emitMainQueue, parser, settings);
		session._frameOffset = 0;
		session._frameLimit = 0;
		session._broadcastMode = true;
		return session;
	}

	// --- Inline frame buffer helpers (replaces ByteBuffer) ---

	private _frameReadVarint32(): number {
		const buf = this._frameBuf;
		let offset = this._frameOffset;
		let result = 0;
		let shift = 0;
		let b: number;
		do {
			b = buf[offset++]!;
			result |= (b & 0x7f) << shift;
			shift += 7;
		} while ((b & 0x80) !== 0 && shift < 35);
		if (shift === 35 && b > 15) throw new Error('Invalid frame varint');
		this._frameOffset = offset;
		return result >>> 0;
	}

	private _frameSkip(n: number): void {
		this._frameOffset += n;
	}

	/** Slow path for headers split across chunks or immediately before EOF. */
	private _frameReadCheckedVarint32(): number {
		let value = 0;
		for (let shift = 0; shift < 35; shift += 7) {
			this.ensureRemaining(1);
			const byte = this._frameBuf[this._frameOffset++]!;
			if (shift === 28 && byte > 15) throw new Error('Invalid frame varint');
			value |= (byte & 127) << shift;
			if ((byte & 128) === 0) return value >>> 0;
		}
		throw new Error('Invalid frame varint');
	}

	// === Public API ===

	/**
	 * Run non-blocking parse to completion, yielding to the event loop periodically.
	 * When `readNextChunk` is provided, truncated frame reads wait for the next stream
	 * chunk and resume from the start of that frame.
	 */
	async runAsync(readNextChunk?: () => Promise<Uint8Array | null>): Promise<void> {
		if (this._broadcastMode) {
			throw new Error('runAsync is not supported on broadcast sessions; use pushBroadcastFragment');
		}
		let forceBreak = false;
		const onCancel = () => {
			forceBreak = true;
		};
		this.parser.on('cancel', onCancel);
		let frameCount = 0;
		let lastYieldTime = Date.now();

		try {
			while (true) {
				if (forceBreak) break;
				this._frameMarked = this._frameOffset;
				try {
					if (++frameCount % 5000 === 0) {
						this.enqueueEvent('progress', this.getProgress());
					}
					if (!this.readFrame(readNextChunk !== undefined)) break;

					const now = Date.now();
					if (now - lastYieldTime >= 16) {
						lastYieldTime = now;
						await new Promise<void>(resolve => setTimeout(resolve, 0));
					}
				} catch (e) {
					if (e === NEED_MORE_INPUT && readNextChunk) {
						// Incremental stream input may stop in the middle of a frame. Restore
						// the frame boundary before appending more bytes and trying again.
						this._frameOffset = Math.max(0, this._frameMarked);
						let chunk: Uint8Array | null;
						try {
							chunk = await readNextChunk();
						} catch (streamError) {
							if (!forceBreak) {
								const error =
									streamError instanceof Error
										? streamError
										: new Error(`Exception while reading demo stream: ${streamError}`);
								this.enqueueEvent('end', { error, incomplete: true });
							}
							break;
						}

						if (forceBreak) break;
						if (chunk === null) {
							if (this._readingTrailer) this.finishDemo();
							else this.enqueueEvent('end', { incomplete: true });
							break;
						}

						this.pushChunk(chunk);
						continue;
					}

					if (e === NEED_MORE_INPUT) {
						this.enqueueEvent('end', { incomplete: true });
					} else {
						const error = e instanceof Error ? e : new Error(`Exception during parsing: ${e}`);
						this.enqueueEvent('debug', JSON.stringify(this.dumpState()));
						this.enqueueEvent('error', { error: e } as any);
						this.enqueueEvent('end', { error, incomplete: false });
					}
					break;
				}
			}
		} finally {
			this.parser.off('cancel', onCancel);
		}
		this.flush();
	}

	private getProgress(): number {
		return this._inputOffset + this._frameOffset;
	}

	/** Push a stream chunk for incremental parsing. */
	pushChunk(chunk: Uint8Array): void {
		if (this._broadcastMode) {
			throw new Error('pushChunk is not supported on broadcast sessions; use pushBroadcastFragment');
		}
		this.chunks.push(chunk);
	}

	/**
	 * Process one HTTP-broadcast fragment.
	 *
	 * Walks the broadcast wire format
	 * `[uvarint cmd][LE u32 tick][byte 0][LE u32 size][payload]` and dispatches
	 * each command via the same `handleFrame` path used by file/stream parsing.
	 *
	 * @param buf            the fragment bytes (not snappy-compressed at this layer; per-command compression is handled by handleFrame).
	 * @param tickOffset     -1 for `/start` fragments, 0 for `/full` and `/delta`.
	 * @returns `{ ended: true }` if a `command === 0` end-of-stream marker was reached.
	 */
	pushBroadcastFragment(buf: Uint8Array, tickOffset: number): { ended: boolean } {
		let off = 0;
		const len = buf.length;

		const readUVarInt32 = (): number => {
			let result = 0;
			let shift = 0;
			let b: number;
			do {
				if (off >= len) throw new RangeError('Truncated broadcast fragment (varint)');
				b = buf[off++]!;
				result |= (b & 0x7f) << shift;
				shift += 7;
			} while ((b & 0x80) !== 0 && shift < 35);
			return result >>> 0;
		};
		const readLEUInt32 = (): number => {
			if (off + 4 > len) throw new RangeError('Truncated broadcast fragment (uint32)');
			const v = (buf[off]! | (buf[off + 1]! << 8) | (buf[off + 2]! << 16) | (buf[off + 3]! << 24)) >>> 0;
			off += 4;
			return v;
		};

		while (off < len && !this.parser.hasEnded) {
			const command = readUVarInt32();
			const rawTick = readLEUInt32() | 0; // sign-extend 32 bits
			if (off >= len) throw new RangeError('Truncated broadcast fragment (reserved byte)');
			const reserved = buf[off++]!;
			if (reserved !== 0) {
				this.enqueueEvent(
					'debug',
					`broadcast fragment reserved byte was 0x${reserved.toString(16)}, expected 0`
				);
			}

			if (command === 0) {
				// End-of-stream marker. Don't read size/payload.
				this.reportUserCmdDeltaHealth();
				if (this.currentTick !== -1) this.enqueueEvent('tickend', this.currentTick);
				this.enqueueEvent('end', { incomplete: false, reason: 'stop' });
				this._resetFrameState();
				if (this.eventQueue.length > 0) this.emitMainQueue(this.eventQueue, 0, false);
				return { ended: true };
			}

			const size = readLEUInt32();
			if (off + size > len) {
				throw new RangeError(
					`Truncated broadcast fragment (payload, want ${size} bytes, ${len - off} available)`
				);
			}

			let tick = rawTick + tickOffset;
			if (tick < 0) tick = -1;

			if (this.currentTick !== tick) {
				if (this.currentTick !== -1) this.enqueueEvent('tickend', this.currentTick);
				this.currentTick = tick;
				this.enqueueEvent('tickstart', this.currentTick);
			}

			const commandType = command & ~EDemoCommands.DEM_IsCompressed;
			const isCompressed = (command & EDemoCommands.DEM_IsCompressed) !== 0;
			const decoder = decoders[commandType as keyof typeof decoders];

			if (!decoder) {
				this.noteUnknownFrameCommand(commandType, command, size);
				off += size;
				continue;
			}

			// handleFrame -> baseParse -> decompressIfNeeded reads `size` bytes from
			// _frameBuf starting at _frameOffset, and advances _frameOffset by `size`.
			this._frameBuf = buf;
			this._frameOffset = off;
			this._frameLimit = off + size;
			if (commandType === EDemoCommands.DEM_Packet || commandType === EDemoCommands.DEM_SignonPacket) {
				// Broadcast wire format delivers the SVC bit-stream directly here;
				// .dem files wrap it in a CDemoPacket envelope, broadcasts do not.
				const data = this.decompressIfNeeded(size, isCompressed);
				this.parsePacket({ data } as CDemoPacket);
				if (this.eventQueue.length > 0) this.emitMainQueue(this.eventQueue, 0, false);
			} else {
				this.handleFrame(decoder, size, isCompressed);
			}
			off += size;
		}

		this._resetFrameState();
		if (this.eventQueue.length > 0) this.emitMainQueue(this.eventQueue, 0, false);
		return { ended: false };
	}

	private _resetFrameState(): void {
		this._frameBuf = new Uint8Array(0);
		this._frameOffset = 0;
		this._frameLimit = 0;
	}

	/** Flush remaining events to the consumer. */
	flush(): void {
		this.emitMainQueue(this.eventQueue, 0, false);
	}

	// === Buffer management ===

	private tryEnsureRemaining(bytes: number): boolean {
		const remaining = this._frameLimit - this._frameOffset;
		if (remaining >= bytes) return true;

		// Stream-based path: fold pending chunks into the carry buffer
		let pending = 0;
		for (let i = 0; i < this.chunks.length; ++i) pending += this.chunks[i]!.length;

		// We don't have enough bytes with what we have buffered up
		if (remaining + pending < bytes) return false;

		return this.coalesceStream(pending);
	}

	/**
	 * Fold buffered stream chunks into one contiguous window.
	 *
	 * Reuse one carry buffer: compact unread bytes to the front, append incoming
	 * chunks, and grow only when a frame needs more room.
	 */
	private coalesceStream(pending: number): boolean {
		const mark = Math.max(0, this._frameMarked);
		const unreadLen = this._frameLimit - mark;
		const total = unreadLen + pending;

		const existing = this._carry;
		let buf: Uint8Array;
		if (existing === null || existing.length < total) {
			// Grow geometrically so a run of small chunks doesn't reallocate each time.
			const capacity = Math.max(total, (existing?.length ?? ParseSession.CARRY_INITIAL_SIZE) * 2);
			buf = new Uint8Array(capacity);
			if (unreadLen > 0) buf.set(this._frameBuf.subarray(mark, this._frameLimit), 0);
		} else {
			buf = existing;
			if (unreadLen > 0) {
				if (buf === this._frameBuf) buf.copyWithin(0, mark, this._frameLimit);
				else buf.set(this._frameBuf.subarray(mark, this._frameLimit), 0);
			}
		}

		let offset = unreadLen;
		for (let i = 0; i < this.chunks.length; ++i) {
			const chunk = this.chunks[i]!;
			buf.set(chunk, offset);
			offset += chunk.length;
		}
		this.chunks.length = 0;

		this._carry = buf;
		this._frameBuf = buf;
		this._inputOffset += mark;
		this._frameOffset -= mark;
		this._frameMarked = 0;
		this._frameLimit = offset;

		return true;
	}

	private ensureRemaining(bytes: number): void {
		if (!this.tryEnsureRemaining(bytes)) {
			throw NEED_MORE_INPUT;
		}
	}

	private decompressIfNeeded(size: number, isCompressed: boolean, owned = false) {
		const bytes = this._frameBuf.subarray(this._frameOffset, this._frameOffset + size);
		this._frameOffset += size;

		if (isCompressed) {
			return owned ? this.parser._snappy.uncompress(bytes) : this.parser._snappy.uncompressFrame(bytes);
		}

		return owned ? Uint8Array.from(bytes) : bytes;
	}

	private baseParse<T extends Decoders[DecoderKeys]['decode']>(
		decoder: T,
		size: number,
		isCompressed: boolean,
		handler?: (data: ReturnType<T>) => ReturnType<T> | void
	) {
		const data = this.decompressIfNeeded(size, isCompressed);
		this.binaryR.setTo(data);
		const decoded = decoder(this.binaryR);
		if (!handler) return decoded as ReturnType<T>;
		return handler(decoded as ReturnType<T>);
	}

	// === Frame-level parsing ===

	private readFrame(allowPartialTrailer = false): boolean {
		if (this._readingTrailer) return this.readTrailerFrame(allowPartialTrailer);
		let commandBase: number;
		let tick: number;
		let size: number;
		if (this.tryEnsureRemaining(15)) {
			// Three uint32 varints need at most 15 bytes; keep the hot path unchecked.
			commandBase = this._frameReadVarint32();
			tick = this._frameReadVarint32();
			size = this._frameReadVarint32();
		} else {
			commandBase = this._frameReadCheckedVarint32();
			tick = this._frameReadCheckedVarint32();
			size = this._frameReadCheckedVarint32();
		}
		if (tick === 0xffffffff) {
			tick = -1;
		}
		this.ensureRemaining(size);

		if (this.currentTick !== tick) {
			if (this.currentTick !== -1) this.enqueueEvent('tickend', this.currentTick);
			this.currentTick = tick;
			this.enqueueEvent('tickstart', this.currentTick);
		}

		const commandType = commandBase & ~EDemoCommands.DEM_IsCompressed;
		if (commandType === EDemoCommands.DEM_Stop) {
			this._frameSkip(size);
			this._readingTrailer =
				this.parser.listenerCount('DEM_FileInfo') > 0 || this.parser.listenerCount('DEM_SpawnGroups') > 0;
			return this._readingTrailer || this.finishDemo();
		}

		const decoder = decoders[commandType as keyof typeof decoders];

		if (!decoder) {
			this.noteUnknownFrameCommand(commandType, commandBase, size);
			this._frameSkip(size);
			return true;
		}

		const isCompressed = (commandBase & EDemoCommands.DEM_IsCompressed) !== 0;
		this.handleFrame(decoder, size, isCompressed);
		return true;
	}

	/**
	 * Read the frames CS2 writes *after* `DEM_Stop` — `CDemoSpawnGroups` and
	 * `CDemoFileInfo`, the latter carrying playback time/ticks/frames.
	 *
	 * Stream refills may split any header or body byte. A partial trailer waits
	 * for another chunk; EOF completes the demo even if its trailer is absent or
	 * truncated. DEM_Stop has already established that gameplay is complete.
	 */
	private readTrailerFrame(allowPartial: boolean): boolean {
		try {
			const commandBase = this._frameReadCheckedVarint32();
			this._frameReadCheckedVarint32(); // trailer frames do not advance gameplay ticks
			const size = this._frameReadCheckedVarint32();
			this.ensureRemaining(size);

			const commandType = commandBase & ~EDemoCommands.DEM_IsCompressed;
			const decoder = decoders[commandType as keyof typeof decoders];
			if (!decoder) {
				this._frameSkip(size);
			} else {
				this.handleFrame(decoder, size, (commandBase & EDemoCommands.DEM_IsCompressed) !== 0);
			}
			return true;
		} catch (error) {
			if (error !== NEED_MORE_INPUT || allowPartial) throw error;
			this._frameOffset = this._frameMarked;
			return this.finishDemo();
		}
	}

	private finishDemo(): false {
		this.reportUserCmdDeltaHealth();
		this.enqueueEvent('tickend', this.currentTick);
		this.enqueueEvent('progress', this.getProgress());
		this.enqueueEvent('end', { incomplete: false });
		return false;
	}

	/**
	 * Surface delta-reconstruction problems once, rather than per command. Silence
	 * here means every delta in the demo resolved.
	 */
	private reportUserCmdDeltaHealth(): void {
		if (this._userCmdRejected === 0 && this._userCmdDeltasOrphaned === 0) return;
		this.enqueueEvent(
			'debug',
			`usercommand: ${this._userCmdRejected} command(s) rejected, ` +
				`${this._userCmdDeltasOrphaned} delta(s) without a valid baseline`
		);
	}

	private handleFrame(decoder: (typeof decoders)[keyof typeof decoders], size: number, isCompressed: boolean): void {
		switch (decoder.type) {
			case EDemoCommands.DEM_SendTables:
				this.sendTables = this.baseParse(decoder.decode, size, isCompressed) ?? null;
				if (this.sendTables?.data) {
					const copy = new Uint8Array(new ArrayBuffer(this.sendTables.data.byteLength));
					copy.set(new Uint8Array(this.sendTables.data));
					this.sendTables.data = copy;
				}
				break;
			case EDemoCommands.DEM_ClassInfo: {
				const data = this.baseParse(decoder.decode, size, isCompressed);
				if (!data || !this.sendTables) break;

				const classInfo = parseClassInfo(this.sendTables, data);
				this.sendTables = null;
				this.entityParser = new EntityParser(classInfo, this.enqueueEvent);
				this.entityParser.onlyGameRules = this.entityMode === EntityMode.ONLY_GAME_RULES;
				if (this.parser) {
					this.parser.propIdToName = classInfo.propIdToName;
					this.parser.propIdToDecoder = classInfo.propIdToDecoder;
					this.parser.propIdToInfo = classInfo.propIdToInfo;
					this.entityParser.directEntities = this.parser.entities;
					this.entityParser.directPropInfoById = classInfo.propInfoById;
				}
				break;
			}
			case EDemoCommands.DEM_FileHeader:
				this.baseParse(decoder.decode, size, isCompressed, header => {
					this.enqueueEvent('header', header);
				});
				break;
			case EDemoCommands.DEM_Packet:
			case EDemoCommands.DEM_SignonPacket:
				this.baseParse(decoders[EDemoCommands.DEM_Packet].decode, size, isCompressed, packet => {
					this.parsePacket(packet);
				});
				break;
			case EDemoCommands.DEM_FullPacket:
				this.baseParse(decoder.decode, size, isCompressed, (fullPacket: CDemoFullPacket) => {
					if (fullPacket.string_table) {
						for (const snapshot of fullPacket.string_table.tables) {
							const result = applyStringTableSnapshot(snapshot, this.baselines);
							// Mid-stream broadcast joiners receive their initial userinfo via
							// FullPacket snapshots rather than incremental updatestringtable
							// packets. Re-emit those entries as a synthetic updatestringtable
							// so DemoReader's _playerInfoMap listener picks them up.
							if (result?.name === 'userinfo' && result.players.length > 0) {
								this.enqueueEvent('updatestringtable', {
									tableId: -1,
									players: result.players,
									table: {
										name: 'userinfo',
										data: [],
										user_data_size: 0,
										user_data_fixed_size: false,
										flags: 0,
										using_varint_bitcounts: false
									}
								});
							}
						}
					}
					if (fullPacket.packet?.data) this.parsePacket(fullPacket.packet);
				});
				break;
			default: {
				// Every other frame command is listenable by its EDemoCommands name and
				// decoded only when someone is listening.
				if (this.parser.listenerCount(decoder.name) > 0) {
					// Owned decompression avoids copying already-owned native output twice.
					const data = decoder.decode(this.decompressIfNeeded(size, isCompressed, true));
					this.enqueueEvent(decoder.name as 'debug', data as never);
				} else {
					this._frameSkip(size);
				}
				break;
			}
		}
		if (this.eventQueue.length > 0) this.emitMainQueue(this.eventQueue, 0, false);
	}

	/**
	 * Decode one on-demand message, or skip it if nothing wants it.
	 *
	 * `entry` is undefined for a wire id that isn't in the generated registry —
	 * a message Valve added since the protos were last pulled. Those are still
	 * reachable through `anymessage` so they can be identified without a release.
	 */
	private handleOptionalCommand(entry: MessageEntry | undefined, id: number, reader: BitBuffer, size: number) {
		const wantsMessage = entry !== undefined && this.isMessageEnabled(entry.name, entry.id);
		const wantsRaw = this.rawListener;

		if (!wantsMessage && !wantsRaw) {
			reader.skipBytesBetter(size);
			return;
		}

		// Read into a fresh per-message buffer: the decoded message's `bytes` fields
		// (e.g. CMsgVoiceAudio.voice_data) are views into this input, and the event is
		// emitted later from a queue. A shared scratch buffer would be overwritten by
		// the next message before the user's listener runs. Gated above, so this only
		// allocates for messages somebody asked for.
		const msgContent = new Uint8Array(size);
		reader.readBytes(msgContent);

		if (wantsRaw) {
			this.enqueueEvent('anymessage', { name: entry?.name, id, bytes: msgContent });
		}
		if (wantsMessage) {
			const decoded = entry.class.decode(msgContent);
			if ((this.parser?.listenerCount(entry.name) ?? 0) > 0) {
				this.enqueueEvent(entry.name as 'debug', decoded as never);
			}
			if (this._derivedSources.has(entry.id)) this.emitDerived(entry.id, decoded);
		}
	}

	/**
	 * Recompute which messages anyone is listening for. Called once per packet
	 * and once per frame; the parser bumps `_listenerEpoch` whenever a listener is
	 * added or removed, so a listener attached mid-parse takes effect from the
	 * next packet.
	 */
	private refreshSubscriptions(): void {
		const epoch = this.parser?._listenerEpoch ?? 0;
		if (epoch === this._enabledEpoch) return;
		this._enabledEpoch = epoch;
		this._enabledCache.clear();
		this.rawListener = (this.parser?.listenerCount('anymessage') ?? 0) > 0;
		const userCommandsEnabled =
			(this.parser?.listenerCount('usercommand') ?? 0) > 0 && this.settings?.svc_UserCmds !== false;
		if (userCommandsEnabled !== this._userCommandsEnabled) {
			this._userCmdBaselines.length = 0;
			this._userCommandsEnabled = userCommandsEnabled;
		}

		// Derived events aren't messages, so their sources have to be enabled
		// explicitly: `chat` needs both SayText variants, `usercommand` needs
		// svc_UserCmds.
		this._derivedSources.clear();
		for (const [event, sources] of DERIVED_EVENTS) {
			if ((this.parser?.listenerCount(event) ?? 0) === 0) continue;
			for (const id of sources) this._derivedSources.add(id);
		}
	}

	/**
	 * A message is decoded when something is listening for it, when a derived event
	 * needs it, or when it was explicitly enabled through {@link ParseSettings}. An
	 * explicit `false` wins over a listener, so a parse can opt out of a message its
	 * consumer handles elsewhere.
	 */
	private isMessageEnabled(name: string, id: number): boolean {
		const cached = this._enabledCache.get(name);
		if (cached !== undefined) return cached;

		const explicit = (this.settings as Record<string, boolean | undefined> | undefined)?.[name];
		const enabled =
			explicit === true ||
			(explicit !== false && ((this.parser?.listenerCount(name) ?? 0) > 0 || this._derivedSources.has(id)));
		this._enabledCache.set(name, enabled);
		return enabled;
	}

	/** Fan a decoded message out to the events synthesised from it. */
	private emitDerived(id: number, decoded: unknown): void {
		if (id === SVC_Messages.svc_UserCmds) {
			if ((this.parser?.listenerCount('usercommand') ?? 0) === 0) return;
			for (const command of (decoded as CSVCMsg_UserCommands).commands) {
				const playerSlot = command.player_slot ?? -1;
				const deltaData = command.data === undefined ? (command.delta_data ?? null) : null;
				let cmd: CSGOUserCmdPB | null = null;

				if (command.data !== undefined) {
					// A full command: decode it and make it the slot's new baseline. The
					// inner payload is a CS-specific submessage the wire format carries as
					// opaque bytes; a malformed one shouldn't take down the parse.
					try {
						cmd = CSGOUserCmdPB.decode(command.data);
					} catch {
						this._userCmdRejected++;
					}
				} else if (deltaData) {
					// Deltas chain. Failure invalidates the slot until a full command
					// supplies the state that subsequent deltas expect.
					const baseline = playerSlot >= 0 ? this._userCmdBaselines[playerSlot] : null;
					if (baseline) {
						cmd = applyUserCmdDelta(baseline, deltaData);
						if (!cmd) this._userCmdRejected++;
					} else {
						// No full command for this slot yet; nothing to apply against.
						this._userCmdDeltasOrphaned++;
					}
				}
				if (playerSlot >= 0) this._userCmdBaselines[playerSlot] = cmd;

				this.enqueueEvent('usercommand', {
					playerSlot,
					cmdNumber: command.cmd_number ?? -1,
					clientTick: command.client_tick ?? -1,
					serverTickExecuted: command.server_tick_executed ?? -1,
					cmd,
					isDelta: deltaData !== null,
					deltaData
				});
			}
			return;
		}

		if (id === EBaseUserMessages.UM_SayText || id === EBaseUserMessages.UM_SayText2) {
			if ((this.parser?.listenerCount('chat') ?? 0) === 0) return;
			const isSayText2 = id === EBaseUserMessages.UM_SayText2;
			// SayText indexes players by userinfo slot, SayText2 by entity index —
			// both are 1-based here, and 0 means "from the server".
			const raw = decoded as CUserMessageSayText & CUserMessageSayText2;
			const index = isSayText2 ? raw.entityindex : raw.playerindex;
			this.enqueueEvent('chat', {
				player: index !== undefined && index > 0 ? (this.parser?.getPlayer(index) ?? null) : null,
				text: (isSayText2 ? raw.param2 : raw.text) ?? '',
				source: isSayText2 ? 'UM_SayText2' : 'UM_SayText',
				messageName: isSayText2 ? raw.messagename : undefined,
				raw: decoded as CUserMessageSayText | CUserMessageSayText2
			});
		}
	}

	// === Packet-level parsing ===

	private readPacketBytes(reader: BitBuffer, size: number): Uint8Array {
		if (this.packetBuffer.length < size) {
			this.packetBuffer = new Uint8Array(Math.max(size, this.packetBuffer.length * 2, 4096));
		}
		return reader.readBytesToSlice(this.packetBuffer, size);
	}

	private parsePacket(packet: CDemoPacket): void {
		if (!packet.data) return;

		this.refreshSubscriptions();

		const reader = this.cachedBitBuffer.setTo(packet.data);
		const gameEventQueue = this.gameEventQueue;
		const packetEntitiesQueue = this.packetEntitiesQueue;
		let entityOffset = 0;

		try {
			while (reader.RemainingBits > 8) {
				const cmd = reader.readUbitVar();
				const size = reader.ReadUVarInt32();
				// Validate before any allocation, including optional messages and scratch growth.
				if (size > reader.RemainingBytes) throw new RangeError('Truncated packet message');
				const command = messageById[cmd];

				if (!command || !command.core) {
					// Non-core (or unknown) message: decode it only if something wants it.
					this.handleOptionalCommand(command, cmd, reader, size);
					continue;
				}

				switch (command.id) {
					case SVC_Messages.svc_PacketEntities: {
						if (this.entityMode === EntityMode.NONE) {
							reader.skipBytesBetter(size);
							continue;
						}
						if (entityOffset + size > this.entityBuffer.length) {
							// Earlier messages keep their old segment alive until the packet drains.
							this.entityBuffer = new Uint8Array(
								Math.max(size, this.entityBuffer.length * 2, 128 * 1024)
							);
							entityOffset = 0;
						}
						const msgContent = this.entityBuffer.subarray(entityOffset, entityOffset + size);
						entityOffset += size;
						reader.readBytes(msgContent);
						this.binaryR2.setTo(msgContent);
						packetEntitiesQueue.push(CSVCMsg_PacketEntities.decode(this.binaryR2));
						break;
					}
					case SVC_Messages.svc_ServerInfo: {
						// Fresh buffer: CSVCMsg_ServerInfo retains `bytes` views (game_session_manifest,
						// game_session_config.data) that must survive past the next message's buffer reuse.
						const msgContent = new Uint8Array(size);
						reader.readBytes(msgContent);
						const serverInfo = CSVCMsg_ServerInfo.decode(msgContent);
						this.enqueueEvent('serverinfo', serverInfo);
						break;
					}
					case EBaseGameEvents.GE_Source1LegacyGameEventList: {
						const msgContent = this.readPacketBytes(reader, size);
						this.binaryR2.setTo(msgContent);
						const eventlist = CMsgSource1LegacyGameEventList.decode(this.binaryR2);
						this.enqueueEvent('gameeventlist', eventlist);
						break;
					}
					case EBaseGameEvents.GE_Source1LegacyGameEvent: {
						const msgContent = this.readPacketBytes(reader, size);
						this.binaryR2.setTo(msgContent);
						gameEventQueue.push(CMsgSource1LegacyGameEvent.decode(this.binaryR2));
						break;
					}
					case SVC_Messages.svc_CreateStringTable: {
						const msgContent = this.readPacketBytes(reader, size);
						this.binaryR2.setTo(msgContent);
						const tableCreatedData = createStringTable(
							CSVCMsg_CreateStringTable.decode(this.binaryR2),
							this.baselines,
							this.parser._snappy
						);
						this._stringTables.push(tableCreatedData?.table ?? null);
						this.enqueueEvent('createstringtable', tableCreatedData || null);
						break;
					}
					case SVC_Messages.svc_UpdateStringTable: {
						const msgContent = this.readPacketBytes(reader, size);
						this.binaryR2.setTo(msgContent);
						const updateMsg = CSVCMsg_UpdateStringTable.decode(this.binaryR2);
						if ('table_id' in updateMsg) {
							const tableCData = updateStringTable(
								updateMsg,
								this._stringTables,
								this.baselines,
								this.parser._snappy
							);
							if (tableCData) {
								// Deliberately does not touch `_stringTables`. That array is indexed
								// by table_id — i.e. creation order — so only svc_CreateStringTable
								// may append to it, and the only thing we read back is the decoding
								// metadata fixed at creation. Pushing here (as this used to) grew the
								// array past every valid id and retained a parsed table per update.
								this.enqueueEvent('updatestringtable', tableCData);
							}
						}
						break;
					}
					case SVC_Messages.svc_ClearAllStringTables:
						reader.skipBytesBetter(size);
						// Drop the tables and the instance baselines derived from them. Without
						// this, tables recreated after a clear are appended past the stale entries
						// and `table_id` stops indexing them, so later updates resolve against the
						// wrong table.
						this._stringTables.length = 0;
						this.baselines.length = 0;
						this.enqueueEvent('clearallstringtables');
						break;
					default:
						// Unreachable: `core` is exactly the set of ids cased above.
						reader.skipBytesBetter(size);
						break;
				}
			}

			for (const queueElement of packetEntitiesQueue) {
				this.entityParser?.parseEntityPacket(queueElement, this.baselines);
			}
			for (const event of gameEventQueue) {
				this.enqueueEvent('gameevent', event);
			}
		} finally {
			packetEntitiesQueue.length = 0;
			gameEventQueue.length = 0;
		}
	}

	private dumpState() {
		return {
			currentTick: this.currentTick,
			bytebufferOffset: this._frameOffset,
			bytebufferRemaining: this._frameLimit - this._frameOffset
		};
	}
}

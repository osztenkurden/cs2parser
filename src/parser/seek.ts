import type { BaseDemoReader, ParseOptions } from './base.js';
import { ParseSession } from './entities/parseSession.js';
import { EntityMode, type ParseOutcome } from './entities/types.js';
import { UnusableCheckpointError, type DecoderCheckpoint } from './replayState.js';
import type { DemoByteSource } from '../replay/source.js';
import { estimateCheckpointBytes } from '../replay/memory.js';

export interface SeekOptions {
	signal?: AbortSignal;
}
export interface SeekLimits {
	/** Maximum retained hydration metadata estimate. Default 32 MiB. */
	maxSeekBytes?: number;
	/** Maximum retained FullPacket locations. Default 4096. */
	maxFullPackets?: number;
	/** Maximum encoded command size. Default 64 MiB. */
	maxFrameBytes?: number;
}
export type SeekOutcome = { status: 'complete'; tick: number } | { status: 'incomplete' | 'cancelled' };
interface Frame {
	offset: number;
	end: number;
	tick: number;
	command: number;
	commandBase: number;
	headerSize: number;
}
interface Location {
	readonly tick: number;
	readonly offset: number;
}
class TruncatedDemo extends Error {}

/** Internal random-access command reader with bounded read-ahead. */
class Commands {
	private cache: Uint8Array = new Uint8Array(0);
	private cacheOffset = 0;
	private pending?: { offset: number; promise: Promise<Uint8Array>; abort: AbortController };
	private readonly size: number;
	bytesRead = 0;
	readAhead = 64 * 1024;
	constructor(
		private source: DemoByteSource,
		private maxFrameBytes: number
	) {
		this.size = source.size;
	}
	bytes(offset: number, length: number, signal?: AbortSignal): Uint8Array | Promise<Uint8Array> {
		signal?.throwIfAborted();
		if (offset + length > this.size) throw new TruncatedDemo('Truncated demo command');
		if (offset >= this.cacheOffset && offset + length <= this.cacheOffset + this.cache.length)
			return this.cache.subarray(offset - this.cacheOffset, offset - this.cacheOffset + length);
		return this.refill(offset, length, signal);
	}
	stopReadAhead() {
		this.pending?.abort.abort();
		this.pending = undefined;
	}
	private async read(offset: number, length: number, signal?: AbortSignal) {
		const bytes = await this.source.read(offset, length, signal);
		signal?.throwIfAborted();
		if (bytes.length !== length) throw new Error('Truncated byte source read');
		this.bytesRead += bytes.length;
		return bytes;
	}
	private async refill(offset: number, length: number, signal?: AbortSignal): Promise<Uint8Array> {
		do {
			const available =
				offset >= this.cacheOffset ? Math.max(0, this.cacheOffset + this.cache.length - offset) : 0;
			const pending = this.pending;
			this.pending = undefined;
			let bytes: Uint8Array;
			if (pending?.offset === offset + available) {
				bytes = await pending.promise;
			} else {
				pending?.abort.abort();
				const fetched = Math.min(Math.max(length, this.readAhead), this.size - offset) - available;
				bytes = await this.read(offset + available, fetched, signal);
			}
			signal?.throwIfAborted();
			if (available) {
				const joined = new Uint8Array(available + bytes.length);
				joined.set(this.cache.subarray(offset - this.cacheOffset));
				joined.set(bytes, available);
				this.cache = joined;
			} else {
				this.cache = bytes;
			}
			this.cacheOffset = offset;
		} while (this.cache.length < length);
		const end = this.cacheOffset + this.cache.length;
		if (this.readAhead === 64 * 1024 && end < this.size) {
			const abort = new AbortController();
			const promise = this.read(
				end,
				Math.min(this.readAhead, this.size - end),
				signal ? AbortSignal.any([signal, abort.signal]) : abort.signal
			);
			// Report speculative read errors only if parsing reaches those bytes.
			void promise.catch(() => {});
			this.pending = { offset: end, promise, abort };
		}
		return this.cache.subarray(0, length);
	}
	decode(session: ParseSession, frame: Frame, signal?: AbortSignal): void | Promise<void> {
		signal?.throwIfAborted();
		if (frame.offset >= this.cacheOffset && frame.end <= this.cacheOffset + this.cache.length) {
			session.readCommand(
				this.cache,
				frame.offset,
				frame.commandBase,
				frame.headerSize,
				frame.offset - this.cacheOffset,
				frame.end - frame.offset
			);
			return;
		}
		return this.refill(frame.offset, frame.end - frame.offset, signal).then(bytes =>
			session.readCommand(bytes, frame.offset, frame.commandBase, frame.headerSize)
		);
	}
	frame(offset: number, signal?: AbortSignal): Frame | Promise<Frame> {
		signal?.throwIfAborted();
		const headerLength = Math.min(15, this.size - offset);
		if (offset >= this.cacheOffset && offset + headerLength <= this.cacheOffset + this.cache.length)
			return this.readFrame(this.cache, offset, offset - this.cacheOffset);
		const bytes = this.bytes(offset, headerLength, signal);
		return bytes instanceof Promise
			? bytes.then(bytes => this.readFrame(bytes, offset))
			: this.readFrame(bytes, offset);
	}
	private readFrame(bytes: Uint8Array, offset: number, start = 0): Frame {
		let position = start;
		const varint = () => {
			let value = 0;
			for (let shift = 0; shift < 35; shift += 7) {
				const byte = bytes[position++];
				if (byte === undefined) throw new TruncatedDemo('Truncated command header');
				if (shift === 28 && byte > 15) throw new Error('Invalid frame varint');
				value |= (byte & 127) << shift;
				if (!(byte & 128)) return value >>> 0;
			}
			throw new Error('Invalid frame varint');
		};
		const commandBase = varint();
		const command = commandBase & ~64;
		const rawTick = varint();
		const length = varint();
		if (length > this.maxFrameBytes) throw new Error('Demo command exceeds maxFrameBytes');
		const end = offset + position - start + length;
		if (end > this.size) throw new TruncatedDemo('Truncated command payload');
		return {
			offset,
			end,
			tick: rawTick === 0xffffffff ? -1 : rawTick,
			command,
			commandBase,
			headerSize: position - start
		};
	}
}

/** Private driver; applications use DemoReader.parseDemo/pause/seekTo/resume and existing events. */
export class SeekSession {
	private readonly commands: Commands;
	private session: ParseSession;
	private offset = 16;
	private ready = true;
	private headerValidated = false;
	private readingTrailer = false;
	private readonly abort = new AbortController();
	private readonly locations: Location[] = [];
	private readonly bad = new Set<number>();
	private seed: DecoderCheckpoint | undefined;
	private seedBytes = 0;
	private scanOffset = 16;
	private scannedToEnd = false;
	private lastTick = -1;
	private lastYield = 0;
	private async cooperate(signal?: AbortSignal) {
		if (performance.now() - this.lastYield > 16) {
			await new Promise<void>(resolve => setTimeout(resolve, 0));
			this.lastYield = performance.now();
			this.parser._reportSeekProgress(this.bytesRead);
		}
		signal?.throwIfAborted();
	}
	isSeeking = false;
	get fullPackets(): readonly Location[] {
		return Object.freeze(this.locations.slice());
	}
	get memoryBytes() {
		return this.seedBytes + this.locations.length * 80 + 32;
	}
	get canRead() {
		return this.ready;
	}
	get position() {
		return this.offset;
	}
	get bytesRead() {
		return this.commands.bytesRead;
	}
	constructor(
		private parser: BaseDemoReader,
		source: DemoByteSource,
		private options: ParseOptions,
		private createReader: () => BaseDemoReader
	) {
		if (!source || !Number.isSafeInteger(source.size) || source.size < 16 || typeof source.read !== 'function')
			throw new TypeError('Expected a seekable raw demo source');
		for (const [name, value] of [
			['maxSeekBytes', options.maxSeekBytes ?? 32 * 1024 * 1024],
			['maxFullPackets', options.maxFullPackets ?? 4096],
			['maxFrameBytes', options.maxFrameBytes ?? 64 * 1024 * 1024]
		] as const)
			if (!Number.isSafeInteger(value) || value < 1) throw new RangeError(`Invalid ${name}`);
		this.commands = new Commands(source, options.maxFrameBytes ?? 64 * 1024 * 1024);
		this.parser._onInternal('cancel', () => this.abort.abort());
		this.session = this.makeSession(this.parser, this.options.entities ?? EntityMode.NONE);
	}
	private makeSession(reader: BaseDemoReader, entities: EntityMode, restore?: DecoderCheckpoint) {
		return new ParseSession(
			new Uint8Array(16),
			entities,
			queue => {
				try {
					for (const element of queue) {
						if (reader.hasEnded) break;
						reader.emit(element[0], element[1] as never);
					}
				} finally {
					queue.length = 0;
				}
			},
			reader,
			this.options,
			restore
		);
	}
	private note(frame: Frame) {
		if (frame.command !== 13 || this.locations.some(location => location.offset === frame.offset)) return;
		if (this.locations.length >= (this.options.maxFullPackets ?? 4096))
			throw new Error('FullPacket location capacity exceeded');
		if (this.memoryBytes + 80 > (this.options.maxSeekBytes ?? 32 * 1024 * 1024))
			throw new Error('Seek metadata exceeds maxSeekBytes');
		this.locations.push(Object.freeze({ tick: frame.tick, offset: frame.offset }));
		this.locations.sort((a, b) => a.offset - b.offset);
	}
	async advance(shouldPause: () => boolean): Promise<void> {
		const signal = this.abort.signal;
		const started = performance.now();
		try {
			if (this.readingTrailer) {
				if (this.parser.listenerCount('DEM_FileInfo') || this.parser.listenerCount('DEM_SpawnGroups')) {
					while (true) {
						let trailer: Frame | Promise<Frame>;
						try {
							trailer = this.commands.frame(this.offset, signal);
							if (trailer instanceof Promise) trailer = await trailer;
						} catch (error) {
							if (error instanceof TruncatedDemo) break;
							throw error;
						}
						const decoded = this.commands.decode(this.session, trailer, signal);
						if (decoded) await decoded;
						this.offset = trailer.end;
					}
				}
				this.parser.emit('progress', this.offset);
				return this.finish({ status: 'complete' });
			}
			let frame = this.commands.frame(this.offset, signal);
			if (frame instanceof Promise) frame = await frame;
			do {
				while (frame.tick < 0 && frame.command !== 0) {
					const decoded = this.commands.decode(this.session, frame, signal);
					if (decoded) await decoded;
					this.offset = frame.end;
					frame = this.commands.frame(this.offset, signal);
					if (frame instanceof Promise) frame = await frame;
				}
				if (frame.command === 0) {
					if (frame.tick !== this.parser.currentTick) {
						this.session.startTick(frame.tick);
						this.session.endTick();
					}
					if (this.parser.hasEnded) return this.finish({ status: 'cancelled' });
					this.offset = frame.end;
					this.readingTrailer = true;
					return;
				}
				const tick = frame.tick;
				this.session.startTick(tick);
				do {
					this.note(frame);
					const decoded = this.commands.decode(this.session, frame, signal);
					if (decoded) await decoded;
					this.offset = frame.end;
					if (this.parser.hasEnded) return this.finish({ status: 'cancelled' });
					frame = this.commands.frame(this.offset, signal);
					if (frame instanceof Promise) frame = await frame;
				} while (frame.tick === tick && frame.command !== 0);
				this.session.endTick();
				if (this.parser.hasEnded || signal.aborted) return this.finish({ status: 'cancelled' });
				this.lastTick = Math.max(this.lastTick, tick);
			} while (!shouldPause() && performance.now() - started < 16);
		} catch (error) {
			if (signal.aborted) return this.finish({ status: 'cancelled' });
			if (error instanceof TruncatedDemo) return this.finish({ status: 'incomplete' });
			this.parser._fail(error);
			throw error;
		}
	}
	private finish(result: ParseOutcome) {
		this.parser._end(result);
	}
	dispose() {
		this.abort.abort();
		this.commands.stopReadAhead();
	}
	seekTo(tick: number, options: SeekOptions = {}): Promise<SeekOutcome> {
		if (!Number.isSafeInteger(tick) || tick < 0)
			return Promise.reject(new RangeError('Expected a nonnegative integer tick'));
		if (this.isSeeking) return Promise.reject(new Error('A seek is already active'));
		return this.performSeek(tick, options);
	}
	private async performSeek(target: number, options: SeekOptions): Promise<SeekOutcome> {
		if (options.signal?.aborted) return { status: 'cancelled' };
		options = {
			signal: options.signal ? AbortSignal.any([options.signal, this.abort.signal]) : this.abort.signal
		};
		this.isSeeking = true;
		this.commands.stopReadAhead();
		this.commands.readAhead = 16 * 1024;
		this.parser._silent = true;
		this.ready = false;
		try {
			if (!this.headerValidated) {
				const magic = await this.commands.bytes(0, 16, options.signal);
				if (new TextDecoder().decode(magic.subarray(0, 8)) !== 'PBDEMS2\0')
					throw new Error('Seeking requires a raw PBDEMS2 .dem');
				this.headerValidated = true;
			}
			await this.discover(target, options.signal);
			if (this.scannedToEnd && target > this.lastTick) return { status: 'incomplete' };
			const candidates = this.locations.filter(c => c.tick < target && !this.bad.has(c.offset)).reverse();
			for (const candidate of [...candidates, undefined]) {
				const checkpoint = candidate ? await this.metadataAt(candidate, options.signal) : undefined;
				if (candidate && !checkpoint) continue;
				this.parser._resetForSeek();
				this.session = this.makeSession(this.parser, this.options.entities ?? EntityMode.NONE, checkpoint);
				this.offset = checkpoint?.offset ?? 16;
				try {
					let activeTick = checkpoint?.previousTick ?? -1;
					let frame = await this.commands.frame(this.offset, options.signal);
					while (frame.tick < target && frame.command !== 0) {
						await this.cooperate(options.signal);
						if (frame.tick !== activeTick) {
							this.session.endTick();
							this.session.startTick(frame.tick);
							activeTick = frame.tick;
						}
						await this.commands.decode(this.session, frame, options.signal);
						this.offset = frame.end;
						frame = await this.commands.frame(this.offset, options.signal);
					}
					this.session.endTick();
					if (frame.command === 0) return { status: 'incomplete' };
					this.parser._reportSeekProgress(this.bytesRead);
					this.ready = true;
					this.readingTrailer = false;
					return { status: 'complete', tick: frame.tick };
				} catch (error) {
					if (candidate && error instanceof UnusableCheckpointError) {
						this.bad.add(candidate.offset);
						continue;
					}
					throw error;
				}
			}
			throw new Error('No usable reconstruction path');
		} catch (error) {
			if (options.signal?.aborted) return { status: 'cancelled' };
			if (error instanceof TruncatedDemo) return { status: 'incomplete' };
			throw error;
		} finally {
			this.commands.readAhead = 64 * 1024;
			this.parser._silent = false;
			this.isSeeking = false;
		}
	}
	/** Header-only scan: FullPacket bodies are decoded later for accumulated metadata. */
	private async discover(target: number, signal?: AbortSignal) {
		while (!this.scannedToEnd) {
			await this.cooperate(signal);
			const frame = await this.commands.frame(this.scanOffset, signal);
			if (frame.command === 0) {
				this.scannedToEnd = true;
				break;
			}
			this.note(frame);
			this.lastTick = Math.max(this.lastTick, frame.tick);
			if (frame.tick >= target) break;
			this.scanOffset = frame.end;
		}
	}
	/** Hydrate once, then revisit only FullPackets (whose tables can be incremental). */
	private async metadataAt(location: Location, signal?: AbortSignal): Promise<DecoderCheckpoint | undefined> {
		const reader = this.createReader();
		reader._silent = true;
		reader.gameEvents.entityMode = EntityMode.NONE;
		const session = this.makeSession(reader, EntityMode.NONE, this.seed);
		let offset = this.seed?.offset ?? 16;
		try {
			while (offset <= location.offset) {
				await this.cooperate(signal);
				const frame = await this.commands.frame(offset, signal);
				if (frame.command === 13 && !this.seed) {
					this.seed = session.captureCheckpoint(frame.offset);
					this.seedBytes = estimateCheckpointBytes(this.seed);
					if (this.memoryBytes > (this.options.maxSeekBytes ?? 32 * 1024 * 1024)) {
						this.seed = undefined;
						this.seedBytes = 0;
						throw new Error('Hydration metadata exceeds maxSeekBytes');
					}
				}
				if (offset === location.offset) return session.captureCheckpoint(frame.offset);
				if ((!this.seed && [1, 4, 5, 7, 8].includes(frame.command)) || frame.command === 13) {
					await this.commands.decode(session, frame, signal);
				}
				offset = this.seed
					? (this.locations.find(c => c.offset > frame.offset)?.offset ?? location.offset + 1)
					: frame.end;
			}
			return undefined;
		} finally {
			reader._snappy.release?.();
		}
	}
}

import type { DemoReader } from '../parser/index.js';
import { ParseSession, type ParseSettings } from '../parser/entities/parseSession.js';
import { EntityMode, type EndReason } from '../parser/entities/types.js';
import { CMsgSource1LegacyGameEventList } from '../ts-proto/gameevents.js';
import { loadBundledEventDescriptors } from './defaultEventDescriptors.js';
import { BroadcastFetchError } from './errors.js';
import { createDefaultFetcher, type BroadcastFetcher, type FetchResult } from './fetcher.js';
import { buildFragmentPrefix, validateSync, type BroadcastSyncDto } from './sync.js';

export interface FragmentErrorContext {
	fragment: number;
	tickOffset: number;
	phase: 'signup' | 'full' | 'delta';
	bytesProcessed: number;
}

export interface HttpBroadcastOptions extends ParseSettings {
	/** Entity parsing mode (default: EntityMode.NONE). */
	entities?: EntityMode;
	/** Custom fetcher; defaults to one built around `globalThis.fetch`. */
	fetcher?: BroadcastFetcher;
	/** Milliseconds to wait between retries on `/full` and `/delta` 404/405. Default 1000. */
	deltaRetryInterval?: number;
	/** Minimum milliseconds between successful `/delta` requests. Default 1000. */
	deltaThrottle?: number;
	/** Max consecutive 404/405 retries on `/delta` before terminating with reason `'timeout'`. Default 10. */
	maxDeltaRetries?: number;
	/** Max consecutive 404/405 retries on `/full` before terminating with reason `'error'`. Default 5. */
	maxFullRetries?: number;
	/** External cancellation signal. */
	signal?: AbortSignal;
	/**
	 * Called when a fragment payload fails to parse. Default behavior is `'abort'`
	 * — return `'continue'` to skip the offending fragment and fetch the next.
	 */
	onFragmentError?: (err: Error, ctx: FragmentErrorContext) => 'abort' | 'continue';
	/**
	 * Pre-loaded `CMsgSource1LegacyGameEventList` for resolving game event names.
	 * Broadcasts only deliver this descriptor list once at game start; clients
	 * connecting mid-stream miss it and would emit `gameevent` payloads without
	 * `event_name`. Pass either the decoded message (e.g. captured from a prior
	 * `gameeventlist` event) or its protobuf-encoded bytes (produced by
	 * `scripts/dump-event-descriptors.ts`).
	 *
	 * If omitted, the reader falls back to a descriptor file bundled with the
	 * package. Pass `false` to disable both — useful if the broadcast you're
	 * connecting to actually delivers its own descriptor list and you'd rather
	 * trust that one.
	 */
	gameEventDescriptors?: CMsgSource1LegacyGameEventList | Uint8Array | false;
}

export interface BroadcastTerminus {
	reason: EndReason;
	error?: unknown;
}

const DEFAULTS = {
	deltaRetryInterval: 1000,
	deltaThrottle: 1000,
	maxDeltaRetries: 10,
	maxFullRetries: 5
} as const;

/**
 * Live HTTP broadcast reader. Drives a {@link DemoReader} from a CS2 GOTV
 * broadcast relay using the `/sync` + `/start` + `/full` + `/delta` polling
 * protocol. Emits the same events as `parseDemo` plus a `broadcastsync` event
 * with the relay metadata.
 *
 * @example
 * const parser = new DemoReader();
 * parser.on('gameevent', e => console.log(e.event_name));
 *
 * const reader = new HttpBroadcastReader(parser, 'https://relay.example.com/match/');
 * await reader.start();
 * const { reason } = await reader.run();
 */
export class HttpBroadcastReader {
	private readonly parser: DemoReader;
	private readonly fetcher: BroadcastFetcher;
	private readonly opts: HttpBroadcastOptions;
	private readonly abortController = new AbortController();
	private session: ParseSession | null = null;
	private _sync: BroadcastSyncDto | null = null;
	private _fragment = 0;
	private _tailTick = -1;
	private _started = false;
	private _running = false;
	private _terminus: BroadcastTerminus | null = null;
	private _prefix = '';
	private _lastDeltaAt = 0;

	private readonly _onTickStart = (t: number) => {
		this._tailTick = t;
	};
	private readonly _onParserCancel = () => {
		this.abortController.abort();
	};
	private readonly _onSignalAbort = () => {
		this.abortController.abort();
	};

	constructor(parser: DemoReader, baseUrl: string, opts: HttpBroadcastOptions = {}) {
		this.parser = parser;
		this.fetcher = opts.fetcher ?? createDefaultFetcher(baseUrl);
		this.opts = opts;

		// Wire cancellation sources to the internal abort controller.
		parser.once('cancel', this._onParserCancel);
		if (opts.signal) {
			if (opts.signal.aborted) this.abortController.abort();
			else opts.signal.addEventListener('abort', this._onSignalAbort, { once: true });
		}
	}

	/** Latest `/sync` response (set after `start()` resolves). */
	get sync(): BroadcastSyncDto | null {
		return this._sync;
	}

	/** Most recently requested fragment number. */
	get fragment(): number {
		return this._fragment;
	}

	/** Most recent tick observed in any processed fragment. */
	get tailTick(): number {
		return this._tailTick;
	}

	/**
	 * Fetch `/sync`, the signup fragment, and the first `/full` fragment.
	 * Resolves once the parser has consumed all three. Throws on protocol
	 * mismatch, sync fetch failure, or signup/full failure. If cancelled
	 * mid-flight, resolves with `terminus.reason === 'cancelled'`.
	 */
	async start(): Promise<void> {
		if (this._started) throw new Error('HttpBroadcastReader.start() already called');
		this._started = true;

		this.parser.on('tickstart', this._onTickStart);

		// /sync
		let raw: unknown;
		try {
			raw = await this.fetcher.json('sync', this.abortController.signal);
		} catch (e) {
			this._unhookListeners();
			if (this._isAbortError(e) || this.abortController.signal.aborted) {
				this._terminus = { reason: 'cancelled' };
				return;
			}
			this._terminus = { reason: 'error', error: e };
			throw e;
		}
		if (this._aborted()) return;

		let sync: BroadcastSyncDto;
		try {
			sync = validateSync(raw);
		} catch (e) {
			this._unhookListeners();
			this._terminus = { reason: 'error', error: e };
			throw e;
		}
		this._sync = sync;
		this._prefix = buildFragmentPrefix(sync.token_redirect);
		this._fragment = sync.fragment;

		this.parser.emit('broadcastsync', sync);
		if (this._aborted()) return;

		// Attach session — this also sets _directWriteMode and entityMode on the parser.
		try {
			this.session = this.parser._attachBroadcastSession(this.opts);
		} catch (e) {
			this._unhookListeners();
			this._terminus = { reason: 'error', error: e };
			throw e instanceof Error ? e : new Error(String(e));
		}

		// Preload event descriptors before any fragment so `gameevent` payloads
		// can resolve their names. Broadcasts seldom resend the descriptor list,
		// so we either (a) use the caller-supplied descriptors, (b) fall back to
		// the descriptor file bundled with the package, or (c) skip preload
		// entirely if the caller passed `false`.
		if (this.opts.gameEventDescriptors !== false) {
			const supplied = this.opts.gameEventDescriptors;
			let list: CMsgSource1LegacyGameEventList | null = null;
			if (supplied instanceof Uint8Array) {
				list = CMsgSource1LegacyGameEventList.decode(supplied);
			} else if (supplied) {
				list = supplied;
			} else {
				list = loadBundledEventDescriptors();
			}
			if (list) this.parser.emit('gameeventlist', list);
		}

		// Signup fragment (tickOffset = -1)
		const signupBytes = await this._fetchOrTerminate(`${this._prefix}${sync.signup_fragment}/start`, {
			phase: 'signup',
			maxRetries: 0,
			fragment: sync.signup_fragment
		});
		if (!signupBytes) return;

		if (await this._processFragment(signupBytes, -1, 'signup', sync.signup_fragment)) return;

		// First /full fragment (tickOffset = 0)
		const fullBytes = await this._fetchWithRetry(
			`${this._prefix}${sync.fragment}/full`,
			'full',
			sync.fragment,
			this.opts.maxFullRetries ?? DEFAULTS.maxFullRetries
		);
		if (!fullBytes) return;

		if (await this._processFragment(fullBytes, 0, 'full', sync.fragment)) return;
	}

	/** @returns true if cancelled (and sets terminus accordingly). */
	private _aborted(): boolean {
		if (this.abortController.signal.aborted && !this._terminus) {
			this._unhookListeners();
			this._terminus = { reason: 'cancelled' };
			return true;
		}
		return !!this._terminus && this._terminus.reason === 'cancelled';
	}

	/**
	 * Loop: GET `{N}/delta` for `N` starting at `sync.fragment + 1`, processing
	 * each, until end-of-stream marker, retry exhaustion, cancellation, or a
	 * fragment parse error. Resolves with the terminal reason.
	 */
	async run(): Promise<BroadcastTerminus> {
		if (!this._started) throw new Error('start() must be awaited before run()');
		if (this._terminus) return this._terminus;
		if (this._running) throw new Error('HttpBroadcastReader.run() already in progress');
		this._running = true;

		try {
			let fragment = this._fragment + 1;

			while (!this.abortController.signal.aborted) {
				// Throttle between successful deltas
				const now = Date.now();
				const wait = (this.opts.deltaThrottle ?? DEFAULTS.deltaThrottle) - (now - this._lastDeltaAt);
				if (wait > 0) {
					if (!(await this._sleep(wait))) return this._terminate('cancelled');
				}

				this._fragment = fragment;
				const bytes = await this._fetchWithRetry(
					`${this._prefix}${fragment}/delta`,
					'delta',
					fragment,
					this.opts.maxDeltaRetries ?? DEFAULTS.maxDeltaRetries
				);
				if (!bytes) return this._terminus!;
				this._lastDeltaAt = Date.now();

				if (await this._processFragment(bytes, 0, 'delta', fragment)) return this._terminus!;
				fragment++;
			}

			return this._terminate('cancelled');
		} finally {
			this._running = false;
		}
	}

	/** Abort the fetch loop and pending HTTP requests. Idempotent. */
	stop(): void {
		if (this._terminus) return;
		this.abortController.abort();
	}

	// ---- internals ----

	private async _fetchOrTerminate(
		path: string,
		ctx: { phase: FragmentErrorContext['phase']; maxRetries: number; fragment: number }
	): Promise<Uint8Array | null> {
		return this._fetchWithRetry(path, ctx.phase, ctx.fragment, ctx.maxRetries);
	}

	private async _fetchWithRetry(
		path: string,
		phase: FragmentErrorContext['phase'],
		fragment: number,
		maxRetries: number
	): Promise<Uint8Array | null> {
		let retries = 0;
		while (true) {
			if (this.abortController.signal.aborted) {
				this._terminate('cancelled');
				return null;
			}
			let result: FetchResult;
			try {
				result = await this.fetcher.bytes(path, this.abortController.signal);
			} catch (e) {
				if (this._isAbortError(e)) {
					this._terminate('cancelled');
					return null;
				}
				this._terminate('error', e);
				return null;
			}

			if (result.ok) return result.data;

			if (retries >= maxRetries) {
				if (phase === 'delta') {
					this._terminate('timeout');
				} else {
					this._terminate(
						'error',
						new BroadcastFetchError(
							`Exhausted ${maxRetries} retries on ${phase} fragment ${fragment}`,
							result.status,
							path
						)
					);
				}
				return null;
			}

			retries++;
			if (!(await this._sleep(this.opts.deltaRetryInterval ?? DEFAULTS.deltaRetryInterval))) {
				this._terminate('cancelled');
				return null;
			}
		}
	}

	/** @returns true if the fragment ended the broadcast (terminal reached). */
	private async _processFragment(
		bytes: Uint8Array,
		tickOffset: number,
		phase: FragmentErrorContext['phase'],
		fragment: number
	): Promise<boolean> {
		if (!this.session) {
			this._terminate('error', new Error('session not attached'));
			return true;
		}

		try {
			const { ended } = this.session.pushBroadcastFragment(bytes, tickOffset);
			if (ended) {
				this._terminus = { reason: 'stop' };
				this._unhookListeners();
				return true;
			}
		} catch (err) {
			const error = err instanceof Error ? err : new Error(String(err));
			const decision = this.opts.onFragmentError?.(error, {
				fragment,
				tickOffset,
				phase,
				bytesProcessed: 0
			});

			if (decision === 'continue') {
				this.parser.emit(
					'debug',
					`broadcast: skipped ${phase} fragment ${fragment} after parse error: ${error.message}`
				);
				return false;
			}
			this._terminate('error', error);
			return true;
		}
		return false;
	}

	private _terminate(reason: EndReason, error?: unknown): BroadcastTerminus {
		if (!this._terminus) {
			this._terminus = error !== undefined ? { reason, error } : { reason };
			// Surface a final 'end' event if the parser hasn't already ended
			// (e.g. via parser.cancel(), which already emits its own 'end').
			if (!this._parserEnded()) {
				this.parser.emit('end', {
					incomplete: reason !== 'stop',
					...(error !== undefined ? { error } : {}),
					reason
				});
			}
			this._unhookListeners();
		}
		return this._terminus;
	}

	private _parserEnded(): boolean {
		// DemoReader._hasEnded is private; the visible signal is that subsequent
		// emits are dropped. Use the listenerCount as a heuristic — but the
		// simpler approach is to rely on the EventEmitter to dedupe. The
		// _emitQueue gate already drops duplicate ends; emitting once more is
		// safe.
		return false;
	}

	private _unhookListeners(): void {
		this.parser.off('tickstart', this._onTickStart);
		this.parser.off('cancel', this._onParserCancel);
		this.opts.signal?.removeEventListener('abort', this._onSignalAbort);
	}

	private _sleep(ms: number): Promise<boolean> {
		return new Promise<boolean>(resolve => {
			if (this.abortController.signal.aborted) return resolve(false);
			const t = setTimeout(() => {
				this.abortController.signal.removeEventListener('abort', onAbort);
				resolve(true);
			}, ms);
			const onAbort = () => {
				clearTimeout(t);
				resolve(false);
			};
			this.abortController.signal.addEventListener('abort', onAbort, { once: true });
		});
	}

	private _isAbortError(e: unknown): boolean {
		return (
			e instanceof Error && (e.name === 'AbortError' || (e instanceof DOMException && e.name === 'AbortError'))
		);
	}
}

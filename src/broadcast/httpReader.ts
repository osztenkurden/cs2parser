import type { BaseDemoReader as DemoReader } from '../parser/base.js';
import { ParseSession, type ParseSessionOptions } from '../parser/entities/parseSession.js';
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
}

export interface HttpBroadcastOptions extends ParseSessionOptions {
	/** Entity parsing mode (default: EntityMode.NONE). */
	entities?: EntityMode;
	/** Custom fetcher; defaults to one built around `globalThis.fetch`. */
	fetcher?: BroadcastFetcher;
	/** Milliseconds to wait between retries on `/full` and `/delta` 404/405. Default 1000. */
	deltaRetryInterval?: number;
	/**
	 * Minimum milliseconds between the *starts* of successive `/delta` requests.
	 * Measured cycle-to-cycle, so fetch/parse latency is absorbed into the
	 * interval instead of added on top. Default 1000.
	 */
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
	private _fragment = -1;
	private _tailTick = -1;
	private _started = false;
	private _starting = false;
	private _running = false;
	private _terminus: BroadcastTerminus | null = null;
	private _prefix = '';
	private _lastDeltaStartedAt = 0;

	private readonly _onTickStart = (t: number) => {
		this._tailTick = t;
	};
	private readonly _onParserCancel = () => {
		this.stop();
	};
	private readonly _onSignalAbort = () => {
		this.stop();
	};

	constructor(parser: DemoReader, baseUrl: string, opts: HttpBroadcastOptions = {}) {
		this.parser = parser;
		this.fetcher = opts.fetcher ?? createDefaultFetcher(baseUrl);
		this.opts = opts;
	}

	/** Latest `/sync` response (set after `start()` resolves). */
	get sync(): BroadcastSyncDto | null {
		return this._sync;
	}

	/** Most recently requested fragment number, or `-1` if `start()` has not yet resolved. */
	get fragment(): number {
		return this._fragment;
	}

	/** Most recent tick observed in any processed fragment. */
	get tailTick(): number {
		return this._tailTick;
	}

	/**
	 * Fetch `/sync`, the signup fragment, and the first `/full` fragment.
	 * Also attempts the starting fragment's own delta. Sync/validation and
	 * descriptor setup failures reject. Signup/full/initial-delta failures are
	 * recorded for run() to return. Synchronous callback exceptions reject after
	 * cleanup. Cancellation resolves; run() then returns reason 'cancelled'.
	 */
	async start(): Promise<void> {
		if (this._started) throw new Error('HttpBroadcastReader.start() already called');
		// Reserve the parser before I/O; a second reader must not terminate an active parse.
		this.session = this.parser._attachBroadcastSession(this.opts, this._onParserCancel);
		this._started = true;
		this._starting = true;
		try {
			await this._start();
			this.parser._throwCallbackError();
		} catch (cause) {
			try {
				this._terminate('error', cause);
			} catch {
				/* Preserve the first exception if an end listener also throws. */
			}
			throw cause;
		} finally {
			this._starting = false;
		}
	}

	private async _start(): Promise<void> {
		// Wire cancellation sources here (not in constructor) so a reader that is
		// constructed but never started doesn't anchor a listener on the parser.
		if (this.opts.signal) {
			if (this.opts.signal.aborted) this.abortController.abort();
			else this.opts.signal.addEventListener('abort', this._onSignalAbort, { once: true });
		}

		this.parser.on('tickstart', this._onTickStart);

		// /sync
		let raw: unknown;
		try {
			raw = await this.fetcher.json('sync', this.abortController.signal);
		} catch (e) {
			if (this._isAbortError(e) || this.abortController.signal.aborted) {
				this._terminate('cancelled');
				return;
			}
			throw e;
		}
		if (this._aborted()) return;

		const sync = validateSync(raw);
		this._sync = sync;
		this._prefix = buildFragmentPrefix(sync.token_redirect);
		this._fragment = sync.fragment;

		this.parser.emit('broadcastsync', sync);
		if (this._aborted()) return;

		// Preload event descriptors before any fragment so `gameevent` payloads
		// can resolve their names. Broadcasts seldom resend the descriptor list,
		// so we either (a) use the caller-supplied descriptors, (b) fall back to
		// the descriptor data embedded in the package, or (c) skip preload
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
		const signupBytes = await this._fetchWithRetry(
			`${this._prefix}${sync.signup_fragment}/start`,
			'signup',
			sync.signup_fragment,
			0
		);
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

		// `{N}/full` is a keyframe at fragment N's *first* tick; fragment N's own
		// `{N}/delta` carries that fragment's ticks, and `{N+1}/delta` starts one
		// keyframe interval later. Going straight from the keyframe to `{N+1}/delta`
		// therefore drops a whole fragment — measured against a live relay:
		// full(6) = tick 1314, delta(6) = 1314..1505, delta(7) = 1506..1697.
		await this._fetchInitialDelta(sync.fragment);
	}

	/**
	 * Fetch the starting fragment's own `/delta`, the one between the keyframe and
	 * the poll loop.
	 *
	 * A single attempt, unlike the retrying `/full` and `/delta` fetches: a relay
	 * only advertises fragment N in `/sync` once it holds both of N's blobs, so a
	 * miss here means a relay that doesn't serve them rather than a fragment worth
	 * waiting for. Log it and start from the keyframe instead of failing the connect.
	 */
	private async _fetchInitialDelta(fragment: number): Promise<void> {
		let result: FetchResult;
		try {
			result = await this.fetcher.bytes(`${this._prefix}${fragment}/delta`, this.abortController.signal);
		} catch (e) {
			if (this._isAbortError(e) || this.abortController.signal.aborted) {
				this._terminate('cancelled');
				return;
			}
			this._terminate('error', e);
			return;
		}

		if (this._aborted()) return;
		if (!result.ok) {
			this.parser.emit(
				'debug',
				`broadcast: ${fragment}/delta unavailable (HTTP ${result.status}); starting from the keyframe, ` +
					`the first keyframe interval of ticks will be missing`
			);
			return;
		}

		await this._processFragment(result.data, 0, 'delta', fragment);
	}

	/** @returns true if cancelled (and sets terminus accordingly). */
	private _aborted(): boolean {
		if (this.abortController.signal.aborted && !this._terminus) {
			this._terminate('cancelled');
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
		if (!this._started || this._starting) throw new Error('start() must be awaited before run()');
		if (this._terminus) return this._terminus;
		if (this._running) throw new Error('HttpBroadcastReader.run() already in progress');
		this._running = true;

		try {
			let fragment = this._fragment + 1;

			while (!this.abortController.signal.aborted) {
				// Throttle: keep successive /delta fetches at least `deltaThrottle` ms
				// apart, anchored on cycle start (not the previous fetch's completion).
				// Anchoring on completion would add fetch+parse latency on top of the
				// throttle every cycle, compounding into real-time drift on slow links.
				const throttle = this.opts.deltaThrottle ?? DEFAULTS.deltaThrottle;
				const wait = throttle - (Date.now() - this._lastDeltaStartedAt);
				if (wait > 0) {
					if (!(await this._sleep(wait))) return this._terminate('cancelled');
				}
				this._lastDeltaStartedAt = Date.now();

				this._fragment = fragment;
				const bytes = await this._fetchWithRetry(
					`${this._prefix}${fragment}/delta`,
					'delta',
					fragment,
					this.opts.maxDeltaRetries ?? DEFAULTS.maxDeltaRetries
				);
				if (!bytes) return this._terminus!;

				if (this.abortController.signal.aborted) return this._terminate('cancelled');
				if (await this._processFragment(bytes, 0, 'delta', fragment)) return this._terminus!;
				fragment++;
			}

			return this._terminate('cancelled');
		} catch (cause) {
			try {
				this._terminate('error', cause);
			} catch {
				/* Preserve the first exception if an end listener also throws. */
			}
			throw cause;
		} finally {
			this._running = false;
		}
	}

	/** Abort the fetch loop and pending HTTP requests. Idempotent. */
	stop(): void {
		if (this._terminus) return;
		this.abortController.abort();
		if (this._started && !this._starting && !this._running) this._terminate('cancelled');
	}

	// ---- internals ----

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
				if (this._isAbortError(e) || this.abortController.signal.aborted) {
					this._terminate('cancelled');
					return null;
				}
				this._terminate('error', e);
				return null;
			}

			if (this._aborted()) return null;
			if (result.ok) return result.data;

			if (retries >= maxRetries) {
				if (phase === 'delta') {
					this._terminate('timeout');
				} else {
					const message =
						maxRetries === 0
							? `${phase} fragment ${fragment} not available (HTTP ${result.status})`
							: `${phase} fragment ${fragment}: HTTP ${result.status} after ${maxRetries} retries`;
					this._terminate('error', new BroadcastFetchError(message, result.status, path));
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
			if (this._aborted()) return true;
			if (ended) {
				this._terminate('stop');
				return true;
			}
		} catch (err) {
			// Listener failures finalize the parser and are not recoverable fragment errors.
			if (this.parser.hasEnded) throw err;
			const error = err instanceof Error ? err : new Error(String(err));
			const decision = this.opts.onFragmentError?.(error, {
				fragment,
				tickOffset,
				phase
			});

			if (decision === 'continue') {
				if (!this._terminus) {
					this.parser.emit(
						'debug',
						`broadcast: skipped ${phase} fragment ${fragment} after parse error: ${error.message}`
					);
				}
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
			try {
				this.parser._end({
					incomplete: reason !== 'stop',
					...(error !== undefined ? { error } : {}),
					reason
				});
			} finally {
				this._unhookListeners();
			}
			this.parser._throwCallbackError();
		}
		return this._terminus;
	}

	private _unhookListeners(): void {
		this.session = null;
		try {
			this.parser.off('tickstart', this._onTickStart);
		} finally {
			this.opts.signal?.removeEventListener('abort', this._onSignalAbort);
		}
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

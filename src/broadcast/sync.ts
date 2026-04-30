import { BroadcastProtocolError } from './errors.js';

/**
 * Metadata returned by the broadcast relay's `/sync` endpoint.
 *
 * Required fields are defined by Valve's spec; the optional fields are
 * emitted by the reference Valve webserver implementation but not strictly
 * required by the wiki schema.
 */
export interface BroadcastSyncDto {
	/** Tick number of the chosen FULL fragment. */
	tick: number;
	/** Seconds since the FULL fragment was received. */
	rtdelay: number;
	/** Seconds since the relay last received data from the game server. */
	rcvage: number;
	/** Fragment number to start fetching from. */
	fragment: number;
	/** Fragment number for the `/start` request. */
	signup_fragment: number;
	/** Ticks per second (typically 64 in CS2). */
	tps: number;
	/** Protocol version. Always 5 for Source 2 broadcasts. */
	protocol: number;
	/** Optional URL path segment for subsequent fragment requests. */
	token_redirect?: string;
	/** Seconds between keyframes. Clients default to 3 if absent. */
	keyframe_interval?: number;
	/** End tick of the chosen fragment. */
	endtick?: number;
	/** Maximum tick available on the relay. */
	maxtick?: number;
	/** Map name. */
	map?: string;
}

/**
 * Validate a parsed `/sync` JSON document and return it as a typed
 * BroadcastSyncDto. Throws BroadcastProtocolError if required fields are
 * missing or the protocol version is unsupported.
 */
export function validateSync(json: unknown): BroadcastSyncDto {
	if (json === null || typeof json !== 'object' || Array.isArray(json)) {
		throw new BroadcastProtocolError('sync response is not an object');
	}
	const o = json as Record<string, unknown>;

	const required = ['tick', 'rtdelay', 'rcvage', 'fragment', 'signup_fragment', 'tps', 'protocol'] as const;
	for (const key of required) {
		if (!Number.isFinite(o[key] as number)) {
			throw new BroadcastProtocolError(`sync response missing required numeric field "${key}"`);
		}
	}

	const nonNegativeIntegers = ['tick', 'fragment', 'signup_fragment', 'tps', 'protocol'] as const;
	for (const key of nonNegativeIntegers) {
		const value = o[key] as number;
		if (!Number.isInteger(value) || value < 0) {
			throw new BroadcastProtocolError(`sync response field "${key}" must be a non-negative integer`);
		}
	}

	const protocol = o['protocol'] as number;
	if (protocol !== 5) {
		throw new BroadcastProtocolError(`unsupported broadcast protocol ${protocol}, expected 5`);
	}

	const dto: BroadcastSyncDto = {
		tick: o['tick'] as number,
		rtdelay: o['rtdelay'] as number,
		rcvage: o['rcvage'] as number,
		fragment: o['fragment'] as number,
		signup_fragment: o['signup_fragment'] as number,
		tps: o['tps'] as number,
		protocol
	};

	if (typeof o['token_redirect'] === 'string' && o['token_redirect'].length > 0) {
		dto.token_redirect = o['token_redirect'] as string;
	}
	if (typeof o['keyframe_interval'] === 'number') dto.keyframe_interval = o['keyframe_interval'] as number;
	if (typeof o['endtick'] === 'number') dto.endtick = o['endtick'] as number;
	if (typeof o['maxtick'] === 'number') dto.maxtick = o['maxtick'] as number;
	if (typeof o['map'] === 'string') dto.map = o['map'] as string;

	return dto;
}

/**
 * Build the per-fragment URL prefix from a base URL and the optional
 * `token_redirect`. Trailing slashes on the redirect token are normalized
 * (matches demofile-net's `tokenRedirect.replace(/\/+$/, '') + '/'`).
 */
export function buildFragmentPrefix(tokenRedirect: string | undefined): string {
	if (!tokenRedirect) return '';
	return tokenRedirect.replace(/\/+$/, '') + '/';
}

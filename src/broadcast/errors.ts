/** Thrown when a broadcast response violates the spec (bad sync, malformed fragment, unsupported protocol). */
export class BroadcastProtocolError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'BroadcastProtocolError';
	}
}

/** Thrown when an HTTP request to the broadcast relay fails with a non-retryable status. */
export class BroadcastFetchError extends Error {
	constructor(
		message: string,
		public readonly status: number,
		public readonly path: string
	) {
		super(message);
		this.name = 'BroadcastFetchError';
	}
}

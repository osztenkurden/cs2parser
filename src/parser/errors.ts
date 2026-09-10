/** Preserve operational Errors, including their identity and stack. */
export function asError(cause: unknown): Error {
	return cause instanceof Error ? cause : new Error(String(cause));
}

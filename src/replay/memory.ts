/** Deterministic retained-data estimate, including graph sharing; not an engine heap measurement. */
export function estimateCheckpointBytes(value: unknown, seen = new Set<object>()): number {
	if (value === null || value === undefined) return 0;
	if (typeof value === 'string') return value.length * 2;
	if (typeof value === 'number' || typeof value === 'bigint') return 8;
	if (typeof value === 'boolean') return 4;
	if (typeof value !== 'object' || seen.has(value)) return 0;
	seen.add(value);
	if (ArrayBuffer.isView(value)) return 32 + estimateCheckpointBytes(value.buffer, seen);
	if (value instanceof ArrayBuffer) return value.byteLength;
	let bytes = 32;
	for (const [key, item] of Object.entries(value)) bytes += key.length * 2 + 8 + estimateCheckpointBytes(item, seen);
	return bytes;
}

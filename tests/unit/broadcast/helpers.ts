import { EDemoCommands } from '../../../src/ts-proto/demo.js';

/** Encode a uint32 as a protobuf-style varint. */
export function writeUVarInt32(value: number): Uint8Array {
	const out: number[] = [];
	let v = value >>> 0;
	while (v > 0x7f) {
		out.push((v & 0x7f) | 0x80);
		v >>>= 7;
	}
	out.push(v & 0x7f);
	return Uint8Array.from(out);
}

/** Encode a uint32 as 4 little-endian bytes. */
export function writeLEUInt32(value: number): Uint8Array {
	const v = value >>> 0;
	return Uint8Array.from([v & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff, (v >>> 24) & 0xff]);
}

export interface BroadcastCommand {
	cmd: number; // EDemoCommands value
	tick: number; // raw tick (before any tickOffset applied by reader)
	payload: Uint8Array;
	isCompressed?: boolean;
	reservedByte?: number; // override the reserved byte (default 0)
}

/**
 * Build a broadcast fragment from a list of commands.
 *
 * Wire format: `[uvarint cmd|0x40 if compressed][LE u32 tick][byte 0][LE u32 size][payload]`.
 * Append `endMarker: true` to emit a trailing `command === 0` end-of-stream marker.
 */
export function buildFragment(commands: BroadcastCommand[], endMarker = false): Uint8Array {
	const parts: Uint8Array[] = [];
	for (const c of commands) {
		const cmdValue = c.cmd | (c.isCompressed ? EDemoCommands.DEM_IsCompressed : 0);
		parts.push(writeUVarInt32(cmdValue));
		parts.push(writeLEUInt32(c.tick));
		parts.push(Uint8Array.of(c.reservedByte ?? 0));
		parts.push(writeLEUInt32(c.payload.length));
		parts.push(c.payload);
	}
	if (endMarker) {
		// command=0, tick=0, reserved=0; no size/payload (per spec)
		parts.push(writeUVarInt32(0));
		parts.push(writeLEUInt32(0));
		parts.push(Uint8Array.of(0));
	}
	const total = parts.reduce((s, p) => s + p.length, 0);
	const out = new Uint8Array(total);
	let off = 0;
	for (const p of parts) {
		out.set(p, off);
		off += p.length;
	}
	return out;
}

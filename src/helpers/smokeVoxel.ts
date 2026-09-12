/**
 * Decoder for `CSmokeGrenadeProjectile.m_VoxelFrameData` — the CS2 volumetric
 * smoke voxel stream.
 *
 * The byte blob is a journal of per-frame records that the game client replays
 * in order to reconstruct the smoke volume. This module decodes simulation
 * inputs, not the resulting smoke density. See docs/smokes.md for
 * usage, supported inputs and rendering limits.
 */

/** Edge length of the smoke voxel grid along each axis (32 → 5 bits/axis). */
export const VOXEL_GRID_DIM = 32;

/**
 * World units per voxel cell. The native world-to-grid scale is 0.05;
 * the grid is centred on the detonation origin (half its 32-cell extent).
 */
export const VOXEL_WORLD_SIZE = 20;
/** Half the grid dimension — the grid centre in voxel coordinates. */
export const VOXEL_GRID_CENTER = VOXEL_GRID_DIM / 2;

/**
 * Grid axes have the same orientation as world axes. Radar image coordinates
 * must be transformed separately; they do not change the world-space grid.
 */
export const VOXEL_AXIS_SIGN: readonly [number, number, number] = [1, 1, 1];

/** A seed entry from a decoded frame, not a cell of the simulated cloud. */
export type SmokeVoxel = {
	/** Grid coordinates in [0, 32). */
	x: number;
	y: number;
	z: number;
	/** The 5 trailing state bytes of the entry (density/flags — not yet fully decoded). */
	state: Uint8Array;
};

/** A single frame record from the voxel journal. */
export type SmokeVoxelFrame = {
	/** Monotonic frame sequence number (0,1,2,…). */
	seq: number;
	/** The frame's payload bytes (length = `payloadLen`). */
	payload: Uint8Array;
	/**
	 * True for a "nothing changed this frame" record. These are the short
	 * (3-byte, all-zero) records carry no new inputs. Simulation can still advance;
	 * non-heartbeats can also carry initialisation or stop-seeding instructions.
	 */
	isHeartbeat: boolean;
};

const HEARTBEAT_LEN = 3;

/**
 * Split `m_VoxelFrameData` into its frame records.
 *
 * @param data  the raw `m_VoxelFrameData` bytes
 * @param size  `m_nVoxelFrameDataSize` — valid byte count (defaults to data.length)
 * @returns the frame records in replay order
 * @throws if a record's payload overruns `size` (malformed / truncated buffer)
 */
export function decodeSmokeVoxelJournal(data: Uint8Array, size = data.length): SmokeVoxelFrame[] {
	if (!Number.isSafeInteger(size) || size < 0 || size > data.length) {
		throw new RangeError('smoke voxel valid size must be an integer within the supplied buffer');
	}
	const end = size;
	const dv = new DataView(data.buffer, data.byteOffset, data.byteLength);
	const frames: SmokeVoxelFrame[] = [];
	let off = 0;
	while (off + 4 <= end) {
		const seq = dv.getUint16(off, true);
		const len = dv.getUint16(off + 2, true);
		const payloadOff = off + 4;
		if (payloadOff + len > end) {
			throw new RangeError(
				`smoke voxel record at offset ${off} declares payload length ${len} which overruns valid size ${end}`
			);
		}
		const payload = data.subarray(payloadOff, payloadOff + len);
		frames.push({ seq, payload, isHeartbeat: isHeartbeatPayload(payload) });
		off = payloadOff + len;
	}
	if (off !== end) throw new RangeError(`truncated smoke voxel record header at offset ${off}`);
	return frames;
}

function isHeartbeatPayload(payload: Uint8Array): boolean {
	if (payload.length !== HEARTBEAT_LEN) return false;
	for (let i = 0; i < payload.length; i++) if (payload[i] !== 0) return false;
	return true;
}

/**
 * Count non-heartbeat records. Despite the historical name, this includes
 * initialisation and stop-seeding records, not just external disturbances.
 */
export function countSmokeDisturbanceFrames(data: Uint8Array, size = data.length): number {
	let n = 0;
	for (const f of decodeSmokeVoxelJournal(data, size)) if (!f.isHeartbeat) n++;
	return n;
}

// --- Per-frame occupancy ---------------------------------------------------
//
// A modern frame payload begins (see scripts/verify-smoke-native.py):
//   u8 stopSeeding
//   u8 sectionFlags
//   if (sectionFlags & 1):  // replacement seed list
//       u8 count
//       count × 8-byte entries: [x, y, z, state0..state4]
//   if (sectionFlags & 2):
//       u16 count; count × [u16 wordIndex, u64 rejectionMask] (little-endian)
//   u8 extraCount; extraCount × 20-byte records (semantics not exposed)
// All fields are byte-aligned in practice, so we parse bytes directly.

const SECTION_OCCUPANCY = 1;
const ENTRY_SIZE = 8;

/**
 * Decode the occupancy voxel list from one frame payload. Returns `null` if the
 * frame carries no occupancy section (heartbeat or extended-data-only frame).
 *
 * Each bit-0 frame replaces the seed list. This historical API name does not
 * mean the returned entries are the complete occupied smoke volume.
 */
export function decodeVoxelFrameOccupancy(payload: Uint8Array): SmokeVoxel[] | null {
	if (payload.length < 2) throw new RangeError('truncated smoke voxel frame header');
	const sectionFlags = payload[1]!;
	if ((sectionFlags & SECTION_OCCUPANCY) === 0) return null;
	if (payload.length < 3) throw new RangeError('truncated smoke voxel seed count');

	const count = payload[2]!;
	if (3 + count * ENTRY_SIZE > payload.length) throw new RangeError('truncated smoke voxel seed entries');
	const voxels: SmokeVoxel[] = [];
	let off = 3;
	for (let i = 0; i < count; i++) {
		if (payload[off]! >= 32 || payload[off + 1]! >= 32 || payload[off + 2]! >= 32) {
			throw new RangeError('smoke voxel seed coordinate outside the 32³ grid');
		}
		voxels.push({
			x: payload[off]!,
			y: payload[off + 1]!,
			z: payload[off + 2]!,
			state: payload.subarray(off + 3, off + ENTRY_SIZE)
		});
		off += ENTRY_SIZE;
	}
	return voxels;
}

/**
 * Get the last transmitted seed list at or before `targetSeq`. This does not
 * advance the client simulation or account for its stop-seeding instruction.
 */
export function getSmokeOccupancyAt(
	frames: SmokeVoxelFrame[],
	targetSeq = Infinity
): { seq: number; voxels: SmokeVoxel[] } | null {
	let latest: { seq: number; voxels: SmokeVoxel[] } | null = null;
	for (const f of frames) {
		if (f.seq > targetSeq) break;
		const voxels = decodeVoxelFrameOccupancy(f.payload);
		if (voxels) latest = { seq: f.seq, voxels };
	}
	return latest;
}

/**
 * Convert a grid cell to its world-space centre: `(grid - 16 + 0.5) * 20 + origin`.
 * The half-cell offset matches the client's grid-to-world function.
 */
export function voxelToWorld(
	x: number,
	y: number,
	z: number,
	origin: readonly [number, number, number],
	voxelSize = VOXEL_WORLD_SIZE,
	center = VOXEL_GRID_CENTER,
	sign: readonly [number, number, number] = VOXEL_AXIS_SIGN
): [number, number, number] {
	return [
		sign[0] * (x - center + 0.5) * voxelSize + origin[0],
		sign[1] * (y - center + 0.5) * voxelSize + origin[1],
		sign[2] * (z - center + 0.5) * voxelSize + origin[2]
	];
}

// --- 3D Morton (Z-order) index mapping for the 32³ grid -------------------
//
// The client folds a voxel's (x,y,z) into a linear grid index by interleaving
// the low bits of each axis. Index = spread(x) | spread(y)<<1 | spread(z)<<2.

/** Spread the low 10 bits of `v` so each bit lands every 3rd position. */
function spread3(v: number): number {
	v &= 0x3ff;
	v = (v | (v << 16)) & 0x030000ff;
	v = (v | (v << 8)) & 0x0300f00f;
	v = (v | (v << 4)) & 0x030c30c3;
	v = (v | (v << 2)) & 0x09249249;
	return v >>> 0;
}

/** Inverse of {@link spread3}: gather every 3rd bit back into a contiguous value. */
function compact3(v: number): number {
	v &= 0x09249249;
	v = (v | (v >>> 2)) & 0x030c30c3;
	v = (v | (v >>> 4)) & 0x0300f00f;
	v = (v | (v >>> 8)) & 0x030000ff;
	v = (v | (v >>> 16)) & 0x000003ff;
	return v >>> 0;
}

/** Encode voxel coordinates to the grid's Morton index (x = least-significant axis). */
export function mortonEncode3(x: number, y: number, z: number): number {
	return (spread3(x) | (spread3(y) << 1) | (spread3(z) << 2)) >>> 0;
}

/** Decode a Morton grid index back to `[x, y, z]` voxel coordinates. */
export function mortonDecode3(index: number): [x: number, y: number, z: number] {
	return [compact3(index), compact3(index >>> 1), compact3(index >>> 2)];
}

/** Decoded inputs to one client simulation step. Byte views alias the payload. */
export type SmokeVoxelInputs = {
	stopSeeding: boolean;
	sectionFlags: number;
	/** Null preserves the previous seed list; an empty array replaces it. */
	seeds: SmokeVoxel[] | null;
	/** Replace these words in the rejection mask. A set bit excludes that cell. */
	blockedUpdates: { index: number; mask: bigint }[];
	/** Additional 20-byte simulation records; their meaning is not yet exposed. */
	extraRecords: Uint8Array[];
};

/** Decode the complete modern (patch version > 13963) frame payload. */
export function decodeSmokeVoxelFrame(payload: Uint8Array): SmokeVoxelInputs {
	if (payload.length < 3) throw new RangeError('truncated smoke voxel frame');
	const sectionFlags = payload[1]!;
	if (sectionFlags & ~3) throw new RangeError(`unsupported smoke voxel section flags: ${sectionFlags}`);
	const seeds = decodeVoxelFrameOccupancy(payload);
	let off = seeds === null ? 2 : 3 + seeds.length * ENTRY_SIZE;
	const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
	const need = (bytes: number) => {
		if (off + bytes > payload.length) throw new RangeError(`truncated smoke voxel section at offset ${off}`);
	};
	const blockedUpdates: SmokeVoxelInputs['blockedUpdates'] = [];
	if (sectionFlags & 2) {
		need(2);
		const count = view.getUint16(off, true);
		off += 2;
		need(count * 10);
		for (let i = 0; i < count; i++, off += 10) {
			const index = view.getUint16(off, true);
			if (index >= 512) throw new RangeError('smoke voxel rejection word index outside the 32³ grid');
			blockedUpdates.push({ index, mask: view.getBigUint64(off + 2, true) });
		}
	}
	need(1);
	const count = payload[off++]!;
	need(count * 20);
	const extraRecords: Uint8Array[] = [];
	for (let i = 0; i < count; i++, off += 20) extraRecords.push(payload.subarray(off, off + 20));
	if (off !== payload.length) throw new RangeError('unexpected trailing smoke voxel payload data');
	return { stopSeeding: payload[0] !== 0, sectionFlags, seeds, blockedUpdates, extraRecords };
}

/** Accumulated journal inputs, not simulated smoke occupancy or density. */
export type SmokeVoxelState = {
	seq: number;
	stopSeeding: boolean;
	seeds: SmokeVoxel[];
	/** 512 words, indexed by Morton index >> 6; bit 1 means rejected. */
	blockedMask: BigUint64Array;
	extraRecords: Uint8Array[];
};

/** Replay a complete journal prefix (starting at sequence 0) through targetSeq. */
export function getSmokeVoxelStateAt(frames: SmokeVoxelFrame[], targetSeq = Infinity): SmokeVoxelState | null {
	let state: SmokeVoxelState | null = null;
	let expected = 0;
	for (const frame of frames) {
		if (frame.seq > targetSeq) break;
		if (frame.seq !== expected++)
			throw new RangeError('smoke voxel state requires contiguous frames starting at 0');
		const inputs = decodeSmokeVoxelFrame(frame.payload);
		state ??= { seq: 0, stopSeeding: false, seeds: [], blockedMask: new BigUint64Array(512), extraRecords: [] };
		state.seq = frame.seq;
		state.stopSeeding = inputs.stopSeeding;
		if (inputs.seeds !== null) state.seeds = inputs.seeds;
		for (const { index, mask } of inputs.blockedUpdates) state.blockedMask[index] = mask;
		state.extraRecords = inputs.extraRecords;
	}
	return state;
}

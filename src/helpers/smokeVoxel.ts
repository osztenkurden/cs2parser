/**
 * Decoder for `CSmokeGrenadeProjectile.m_VoxelFrameData` — the CS2 volumetric
 * smoke voxel stream.
 *
 * The byte blob is a journal of per-frame records that the game client replays
 * in order to reconstruct the smoke volume. This module decodes the journal
 * layer (fully reverse-engineered and verified byte-for-byte against the game
 * client) and exposes the 32³ Morton grid index mapping.
 *
 * See `docs/smoke-voxel-format.md` for the full format and the limits of the
 * per-frame payload decode.
 */

/** Edge length of the smoke voxel grid along each axis (32 → 5 bits/axis). */
export const VOXEL_GRID_DIM = 32;

/**
 * World units per voxel cell. From `client.dll`: the world→grid scale constant
 * `DAT_18192dc50` is 0.05 voxels/unit, i.e. 20 units/voxel. The grid is centred
 * on the detonation origin (`+16` = half the 32-wide grid).
 */
export const VOXEL_WORLD_SIZE = 20;
/** Half the grid dimension — the grid centre in voxel coordinates. */
export const VOXEL_GRID_CENTER = VOXEL_GRID_DIM / 2;

/**
 * Per-axis sign relating voxel grid axes to CS2 world axes (X east, Y north,
 * Z up). The grid's X axis is mirrored relative to world X; Y and Z align.
 * Verified visually on a radar; the magnitudes (scale 20, centre 16) come
 * straight from `client.dll`.
 */
export const VOXEL_AXIS_SIGN: readonly [number, number, number] = [-1, 1, 1];

/** A single occupied voxel from a decoded frame. */
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
	 * (3-byte, all-zero) heartbeats the server emits while the cloud is stable;
	 * a non-heartbeat frame means the volume was modified (bullet / HE / fire).
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
	const end = Math.min(size, data.length);
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
	return frames;
}

function isHeartbeatPayload(payload: Uint8Array): boolean {
	if (payload.length !== HEARTBEAT_LEN) return false;
	for (let i = 0; i < payload.length; i++) if (payload[i] !== 0) return false;
	return true;
}

/**
 * How many frames in the journal actually modified the volume (non-heartbeat).
 * A useful proxy for "how disturbed was this smoke" without a full decode.
 */
export function countSmokeDisturbanceFrames(data: Uint8Array, size = data.length): number {
	let n = 0;
	for (const f of decodeSmokeVoxelJournal(data, size)) if (!f.isHeartbeat) n++;
	return n;
}

// --- Per-frame occupancy ---------------------------------------------------
//
// A frame payload (client.dll FUN_180756800) begins:
//   u8 activeFlag
//   u8 sectionFlags
//   if (sectionFlags & 1):  // occupancy list (full replace of the voxel set)
//       u8 count
//       count × 8-byte entries: [z, y, x, state0..state4]
//   if (sectionFlags & 2):  // extended per-cell data (density/palette) — skipped here
//       ...
// All fields are byte-aligned in practice, so we parse bytes directly.

const SECTION_OCCUPANCY = 1;
const ENTRY_SIZE = 8;

/**
 * Decode the occupancy voxel list from one frame payload. Returns `null` if the
 * frame carries no occupancy section (heartbeat or extended-data-only frame).
 *
 * Each bit-0 frame is a *full replacement* of the active voxel set (the client
 * clears the previous set before applying this one), so the returned list is the
 * complete occupancy as of that frame.
 */
export function decodeVoxelFrameOccupancy(payload: Uint8Array): SmokeVoxel[] | null {
	if (payload.length < 2) return null;
	const sectionFlags = payload[1]!;
	if ((sectionFlags & SECTION_OCCUPANCY) === 0) return null;
	if (payload.length < 3) return null;

	const count = payload[2]!;
	const voxels: SmokeVoxel[] = [];
	let off = 3;
	for (let i = 0; i < count; i++) {
		if (off + ENTRY_SIZE > payload.length) break; // truncated/section boundary
		voxels.push({
			z: payload[off]!,
			y: payload[off + 1]!,
			x: payload[off + 2]!,
			state: payload.subarray(off + 3, off + ENTRY_SIZE)
		});
		off += ENTRY_SIZE;
	}
	return voxels;
}

/**
 * Get the smoke's occupancy as of `targetSeq` (default: the last frame) by
 * finding the most recent occupancy frame at or before it. Because occupancy
 * frames fully replace the set, no accumulation across frames is needed.
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
 * Convert a voxel grid coordinate to a world position, given the smoke's
 * detonation origin. Inverse of the client's world→grid transform
 * `grid = (world - origin) * 0.05 + 16`, with the per-axis {@link VOXEL_AXIS_SIGN}
 * applied (world X is mirrored relative to the grid).
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
		sign[0] * (x - center) * voxelSize + origin[0],
		sign[1] * (y - center) * voxelSize + origin[1],
		sign[2] * (z - center) * voxelSize + origin[2]
	];
}

// --- 3D Morton (Z-order) index mapping for the 32³ grid -------------------
//
// The client folds a voxel's (x,y,z) into a linear grid index by interleaving
// the low bits of each axis. Index = spread(z) | spread(y)<<1 | spread(x)<<2.

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

/** Encode voxel coordinates to the grid's Morton index (z = least-significant axis). */
export function mortonEncode3(x: number, y: number, z: number): number {
	return (spread3(z) | (spread3(y) << 1) | (spread3(x) << 2)) >>> 0;
}

/** Decode a Morton grid index back to `[x, y, z]` voxel coordinates. */
export function mortonDecode3(index: number): [x: number, y: number, z: number] {
	return [compact3(index >>> 2), compact3(index >>> 1), compact3(index)];
}

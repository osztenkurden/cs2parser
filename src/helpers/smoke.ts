import { EntityHelper } from './entityHelper.js';
import type { Vector } from './playerPawn.js';
import { decodeSmokeVoxelJournal, getSmokeOccupancyAt, voxelToWorld, type SmokeVoxel } from './smokeVoxel.js';

/**
 * Helper for a `CSmokeGrenadeProjectile` — a deployed smoke cloud.
 *
 * Wraps the raw voxel-stream decode (see {@link decodeSmokeVoxelJournal} and
 * `docs/smoke-voxel-format.md`) behind a small API. The networked data is the
 * smoke's *seed* occupancy (~44 voxels around the detonation); the game client
 * simulates the visible cloud from it. Voxel positions are computed on demand.
 *
 * Reads go through the Rust-resident decoder's getter API: `m_VoxelFrameData`
 * is a `CUtlBinaryBlock` retrieved via `getBlobProp`, the detonation position
 * via `getVec3Prop`.
 */
export class SmokeHelper extends EntityHelper<'CSmokeGrenadeProjectile'> {
	/** World-space detonation centre (the voxel grid's origin), or `null` if not set yet. */
	get detonationPos(): Vector | null {
		const p = this._vec3('CSmokeGrenadeProjectile.m_vSmokeDetonationPos');
		return p && p.length >= 3 ? { x: p[0]!, y: p[1]!, z: p[2]! } : null;
	}

	/** True once the seed voxel data has arrived on the wire. */
	get hasVoxelData(): boolean {
		const data = this._array('CSmokeGrenadeProjectile.m_VoxelFrameData');
		return data instanceof Uint8Array && data.length > 0;
	}

	/**
	 * Seed voxels in grid coordinates (each axis in `[0, 32)`), decoded on demand
	 * from `m_VoxelFrameData`. Empty if no data has arrived. Each carries its raw
	 * `state` bytes too.
	 */
	get gridVoxels(): SmokeVoxel[] {
		const data = this._array('CSmokeGrenadeProjectile.m_VoxelFrameData');
		if (!(data instanceof Uint8Array) || data.length === 0) return [];
		const size = this._num('CSmokeGrenadeProjectile.m_nVoxelFrameDataSize') ?? data.length;
		return getSmokeOccupancyAt(decodeSmokeVoxelJournal(data, size))?.voxels ?? [];
	}

	/**
	 * Seed voxels as world positions, computed on demand using the verified
	 * voxel→world transform. Empty if there's no voxel data or detonation
	 * position yet.
	 */
	get voxels(): Vector[] {
		const origin = this.detonationPos;
		if (!origin) return [];
		const o: [number, number, number] = [origin.x, origin.y, origin.z];
		return this.gridVoxels.map(v => {
			const [x, y, z] = voxelToWorld(v.x, v.y, v.z, o);
			return { x, y, z };
		});
	}

	/** Number of seed voxels currently decodable. */
	get voxelCount(): number {
		return this.gridVoxels.length;
	}
}

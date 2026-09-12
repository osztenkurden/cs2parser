import type { BaseDemoReader as DemoReader } from '../parser/base.js';
import type { Vector } from './playerPawn.js';
import { EntityHelper } from './entityHelper.js';
import {
	decodeSmokeVoxelJournal,
	getSmokeOccupancyAt,
	voxelToWorld,
	mortonDecode3,
	type SmokeVoxel
} from './smokeVoxel.js';

import { SmokeDensitySimulation } from './smokeDensity.js';

export type SmokeDensityVoxel = Vector & { density: number };

/**
 * Helper for a `CSmokeGrenadeProjectile` — a deployed smoke cloud.
 *
 * Wraps the raw voxel-stream decode (see {@link decodeSmokeVoxelJournal} and
 * `docs/smokes.md`) behind a small API. The networked data is the
 * seed list plus simulation inputs; the client computes the visible cloud.
 * Seeds and simulated density cells are calculated on demand.
 */
export class SmokeHelper extends EntityHelper<'CSmokeGrenadeProjectile'> {
	private densityCache?: {
		entity: object;
		effectTick: unknown;
		origin: [number, number, number];
		bytes: Uint8Array;
		simulation: SmokeDensitySimulation;
		density: Float32Array;
		threshold: number;
		voxels: SmokeDensityVoxel[];
	};
	constructor(parser: DemoReader, entityId: number) {
		super(parser, entityId);
	}

	/** World-space detonation centre (the voxel grid's origin), or `null` if not set yet. */
	get detonationPos(): Vector | null {
		const p = this.prop('CSmokeGrenadeProjectile.m_vSmokeDetonationPos');
		return p ? { x: p[0], y: p[1], z: p[2] } : null;
	}

	/** True once the seed voxel data has arrived on the wire. */
	get hasVoxelData(): boolean {
		const data = this.prop('CSmokeGrenadeProjectile.m_VoxelFrameData');
		return (
			data instanceof Uint8Array &&
			(this.prop('CSmokeGrenadeProjectile.m_nVoxelFrameDataSize') ?? data.length) > 0
		);
	}

	/**
	 * Seed voxels in grid coordinates (each axis in `[0, 32)`), decoded on demand
	 * from `m_VoxelFrameData`. Empty if no data has arrived. Each carries its raw
	 * `state` bytes too.
	 */
	get gridVoxels(): SmokeVoxel[] {
		const data = this.prop('CSmokeGrenadeProjectile.m_VoxelFrameData');
		if (!(data instanceof Uint8Array) || data.length === 0) return [];
		const size = this.prop('CSmokeGrenadeProjectile.m_nVoxelFrameDataSize') ?? data.length;
		if (size === 0) return [];
		const patch = this._parser.header?.patch_version;
		if (patch !== undefined && patch <= 13963) {
			throw new RangeError('legacy smoke voxel seed format (patch <= 13963) is not supported');
		}
		return getSmokeOccupancyAt(decodeSmokeVoxelJournal(data, size))?.voxels ?? [];
	}

	/**
	 * Seed voxels as world positions, computed on demand using the verified
	 * voxel→world transform. Empty if there's no voxel data or detonation
	 * position yet.
	 */
	get seeds(): Vector[] {
		const origin = this.detonationPos;
		if (!origin) return [];
		const o: [number, number, number] = [origin.x, origin.y, origin.z];
		return this.gridVoxels.map(v => {
			const [x, y, z] = voxelToWorld(v.x, v.y, v.z, o);
			return { x, y, z };
		});
	}

	/** Simulated world-space cells above the reader's smokeDensityThreshold. */
	get voxels(): SmokeDensityVoxel[] {
		return this.getVoxels();
	}

	/** Calculate only new journal frames; optionally override the reader's threshold. */
	getVoxels(minDensity = this._parser.smokeDensityThreshold): SmokeDensityVoxel[] {
		if (!Number.isFinite(minDensity) || minDensity < 0)
			throw new RangeError('smoke density threshold must be finite and nonnegative');
		const entity = this.entity;
		const origin = this.detonationPos;
		const data = this.prop('CSmokeGrenadeProjectile.m_VoxelFrameData');
		if (!entity || !origin || !(data instanceof Uint8Array)) {
			this.densityCache = undefined;
			return [];
		}
		const size = this.prop('CSmokeGrenadeProjectile.m_nVoxelFrameDataSize') ?? data.length;
		if (!Number.isSafeInteger(size) || size < 0 || size > data.length)
			throw new RangeError('smoke voxel valid size must be an integer within the supplied buffer');
		if (size === 0) {
			this.densityCache = undefined;
			return [];
		}
		const patch = this._parser.header?.patch_version;
		if (patch !== undefined && patch <= 13963)
			throw new RangeError('legacy smoke voxel seed format (patch <= 13963) is not supported');
		const position: [number, number, number] = [origin.x, origin.y, origin.z];
		const effectTick = this.prop('CSmokeGrenadeProjectile.m_nSmokeEffectTickBegin');
		let cache = this.densityCache;
		// Journal bytes can be updated in place, or replaced after a full snapshot.
		const prefixMatches = cache && cache.bytes.length <= size && cache.bytes.every((v, i) => v === data[i]);
		if (
			!cache ||
			cache.entity !== entity ||
			cache.effectTick !== effectTick ||
			!cache.origin.every((v, i) => v === position[i]) ||
			!prefixMatches
		) {
			cache = {
				entity,
				effectTick,
				origin: position,
				bytes: new Uint8Array(),
				simulation: new SmokeDensitySimulation(position),
				density: new Float32Array(),
				threshold: NaN,
				voxels: []
			};
			this.densityCache = cache;
		}
		if (size > cache.bytes.length) {
			try {
				for (const frame of decodeSmokeVoxelJournal(data.subarray(cache.bytes.length, size)))
					cache.simulation.step(frame);
				cache.density = cache.simulation.snapshot().density;
				cache.bytes = new Uint8Array(data.subarray(0, size));
				cache.threshold = NaN;
			} catch (error) {
				// Never reuse a partially advanced simulation after a failed update.
				this.densityCache = undefined;
				throw error;
			}
		}
		if (cache.threshold !== minDensity) {
			cache.voxels = [];
			for (let i = 0; i < cache.density.length; i++) {
				const density = cache.density[i]!;
				if (density <= minDensity) continue;
				const grid = mortonDecode3(i);
				const [x, y, z] = voxelToWorld(...grid, position);
				cache.voxels.push({ x, y, z, density });
			}
			cache.threshold = minDensity;
		}
		return cache.voxels.map(v => ({ ...v }));
	}

	/** Number of simulated cells above the reader's density threshold. */
	get voxelCount(): number {
		return this.voxels.length;
	}
}

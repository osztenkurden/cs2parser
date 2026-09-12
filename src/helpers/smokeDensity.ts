import { decodeSmokeVoxelFrame, mortonDecode3, mortonEncode3, type SmokeVoxelFrame } from './smokeVoxel.js';

// Intermediate float32 rounding and traversal order are part of the client simulation.
// Reassociating these expressions or batching transfers changes later frames.
const f = Math.fround;
const CELLS = 32768;
const AXES = [
	[-1, 0, 0],
	[1, 0, 0],
	[0, -1, 0],
	[0, 1, 0],
	[0, 0, -1],
	[0, 0, 1]
] as const;
let lookup: { coordinates: Uint8Array; neighbours: Int32Array } | undefined;
function gridLookup() {
	if (lookup) return lookup;
	const coordinates = new Uint8Array(CELLS * 3),
		neighbours = new Int32Array(CELLS * 6);
	for (let i = 0; i < CELLS; i++) {
		const xyz = mortonDecode3(i);
		coordinates.set(xyz, i * 3);
		AXES.forEach((delta, k) => {
			const [x, y, z] = xyz.map((v, a) => v + delta[a]!);
			neighbours[i * 6 + k] =
				x! < 0 || x! >= 32 || y! < 0 || y! >= 32 || z! < 0 || z! >= 32 ? -1 : mortonEncode3(x!, y!, z!);
		});
	}
	return (lookup = { coordinates, neighbours });
}

export type SmokeDensitySnapshot = {
	/** Last applied journal sequence, or -1 before the first step. */
	seq: number;
	/** Raw simulated density in X-low Morton order, copied out of the simulation. Not opacity. */
	density: Float32Array;
};

/**
 * Experimental, opt-in reconstruction of the modern client's smoke density grid.
 * Apply every journal record in sequence, including heartbeats. No render-time
 * interpolation, lifetime opacity, noise, lighting or bullet/HE shader effects.
 * Auxiliary 20-byte records are rejected; they are not silently ignored.
 * See docs/smokes.md for usage and supported inputs.
 */
export class SmokeDensitySimulation {
	private current = new Float32Array(CELLS * 4);
	private next = new Float32Array(CELLS * 4);
	private active = new Uint8Array(CELLS);
	private nextActive = new Uint8Array(CELLS);
	private blocked = new Uint8Array(CELLS);
	private seeds: { index: number; age: number }[] = [];
	private sequence = -1;
	private readonly origin: readonly [number, number, number];
	constructor(origin: readonly [number, number, number]) {
		if (origin.length !== 3 || !origin.every(Number.isFinite))
			throw new RangeError('smoke density origin must contain three finite coordinates');
		this.origin = [f(origin[0]), f(origin[1]), f(origin[2])];
		if (!this.origin.every(Number.isFinite)) throw new RangeError('smoke density origin exceeds float32 range');
	}
	get seq(): number {
		return this.sequence;
	}
	snapshot(): SmokeDensitySnapshot {
		const density = new Float32Array(CELLS);
		for (let i = 0; i < CELLS; i++) density[i] = this.current[i * 4]!;
		return { seq: this.sequence, density };
	}
	step(frame: SmokeVoxelFrame): void {
		if (frame.seq !== this.sequence + 1 || frame.seq > 65535)
			throw new RangeError('smoke density requires contiguous journal frames starting at 0');
		const inputs = decodeSmokeVoxelFrame(frame.payload);
		if (inputs.extraRecords.length) throw new RangeError('additional smoke simulation records are not supported');
		const seeds = inputs.seeds?.map(seed => {
			const age = new DataView(seed.state.buffer, seed.state.byteOffset + 1, 4).getFloat32(0, true);
			if (!Number.isFinite(age)) throw new RangeError('non-finite smoke seed state');
			return { index: mortonEncode3(seed.x, seed.y, seed.z), age };
		});
		if (seeds) this.seeds = seeds;
		for (const { index, mask } of inputs.blockedUpdates) {
			for (let bit = 0; bit < 64; bit++) this.blocked[index * 64 + bit] = Number((mask >> BigInt(bit)) & 1n);
		}
		const { coordinates, neighbours } = gridLookup();
		const current = this.current,
			next = this.next,
			active = this.active,
			nextActive = this.nextActive;
		// Bootstrap adjacent cells once; subsequent records replenish the retained seeds.
		if (this.sequence < 0) {
			for (const seed of this.seeds) {
				const x = coordinates[seed.index * 3]!,
					y = coordinates[seed.index * 3 + 1]!,
					z = coordinates[seed.index * 3 + 2]!;
				for (let dz = -1; dz <= 1; dz++)
					for (let dy = -1; dy <= 1; dy++)
						for (let dx = -1; dx <= 1; dx++) {
							if (
								!(dx || dy || dz) ||
								x + dx < 0 ||
								x + dx >= 32 ||
								y + dy < 0 ||
								y + dy >= 32 ||
								z + dz < 0 ||
								z + dz >= 32
							)
								continue;
							const j = mortonEncode3(x + dx, y + dy, z + dz);
							if (active[j] || this.blocked[j]) continue;
							current[j * 4] = f(current[j * 4]! + 30);
							next[j * 4] = current[j * 4]!;
							active[j] = 1;
						}
				active[seed.index] = 1;
			}
		} else {
			const fresh = this.seeds.reduce((n, seed) => n + Number(seed.age < f(0.01)), 0);
			const cap = f(50 * Math.max(1, f(f(1 - f(fresh / 40)) * 3.5)));
			for (const seed of this.seeds) {
				const i = seed.index,
					p = i * 4;
				if (inputs.stopSeeding) current[p] = 0;
				else {
					// Match the native float32 grid-centre subtraction before the radius check.
					const relative = [0, 1, 2].map(a =>
						f(f(f((coordinates[i * 3 + a]! - 16) * 20 + this.origin[a]!) + 10) - this.origin[a]!)
					);
					const distance = f(
						Math.sqrt(
							f(
								f(f(relative[2]! * relative[2]!) + f(relative[1]! * relative[1]!)) +
									f(relative[0]! * relative[0]!)
							)
						)
					);
					if (distance <= 80) seed.age = f(seed.age * f(0.8));
					else {
						let average = 0;
						for (let k = 0; k < 6; k++) {
							const j = neighbours[i * 6 + k]!;
							if (j >= 0 && active[j])
								average = f(average + Math.min(1, Math.max(0, f(current[j * 4]! / 50))));
						}
						average = f(average / 6);
						if (average > f(0.2)) {
							if (seed.age > 0) seed.age = f(seed.age * f(0.8));
						} else seed.age = 1;
					}
					current[p] = Math.min(cap, f(current[p]! + f(f(1 - seed.age) * 60)));
				}
				active[i] = 1;
				for (let a = 0; a < 4; a++) next[p + a] = current[p + a]!;
			}
		}
		if (inputs.stopSeeding) this.seeds = [];
		// Read from current, subtract neighbour transfers immediately from next, in Morton order.
		const densities = new Float32Array(6);
		for (let i = 0; i < CELLS; i++) {
			if (!active[i]) continue;
			const p = i * 4;
			if (this.blocked[i]) {
				next[p] = 0;
				continue;
			}
			const saturation = Math.min(1, Math.max(0, f(next[p]! / 50)));
			let incoming = 0,
				blockedAxes = 0;
			for (let k = 0; k < 6; k++) {
				const j = neighbours[i * 6 + k]!;
				if (j < 0 || this.blocked[j]) {
					densities[k] = 0;
					blockedAxes |= 1 << (k >> 1);
					continue;
				}
				const q = j * 4,
					delta = AXES[k]!;
				densities[k] = current[q]!;
				const direction = f(
					f(f(-delta[1] * current[q + 2]!) - f(delta[2] * current[q + 3]!)) - f(delta[0] * current[q + 1]!)
				);
				const weight = k === 4 ? f(0.79) : k === 5 ? f(1.2) : direction > f(0.2) ? 1.25 : f(0.9);
				const transfer = f(f(f(1 - saturation) * weight) * f(current[q]! / 6));
				next[q] = Math.max(0, f(next[q]! - transfer));
				incoming = f(incoming + transfer);
				if (!active[j] && current[p]! > 5) nextActive[j] = 1;
			}
			const x = coordinates[i * 3]!,
				y = coordinates[i * 3 + 1]!,
				z = coordinates[i * 3 + 2]!;
			if (x === 0 || x === 31 || y === 0 || y === 31 || z === 0 || z === 31) {
				next[p] = f(next[p]! * f(0.3));
				continue;
			}
			next[p] = f(next[p]! + incoming);
			let vx = blockedAxes & 1 ? 0 : f(densities[0]! - densities[1]!);
			let vy = blockedAxes & 2 ? 0 : f(densities[2]! - densities[3]!);
			const length = f(Math.sqrt(f(f(vy * vy) + f(vx * vx))));
			if (length !== 0) {
				const inv = f(1 / length);
				vx = f(vx * inv);
				vy = f(vy * inv);
			}
			next[p + 1] = vx;
			next[p + 2] = vy;
			next[p + 3] = 0;
			next[p] = Math.max(0, f(next[p]! - (inputs.stopSeeding ? 0.25 : 0.5)));
		}
		// Newly reached cells become active on the following step. Synchronize both buffers
		// before swapping: untouched cells must retain the same state on either side.
		for (let i = 0; i < CELLS; i++) {
			if (active[i]) {
				const p = i * 4;
				for (let a = 0; a < 4; a++) current[p + a] = next[p + a]!;
			}
			active[i] = nextActive[i] = active[i]! | nextActive[i]!;
		}
		this.current = next;
		this.next = current;
		this.active = nextActive;
		this.nextActive = active;
		this.sequence = frame.seq;
	}
}

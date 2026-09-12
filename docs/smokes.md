# Smokes

Smoke helpers require `EntityMode.ALL` and demo patch versions above 13963.
Seed decoding runs on demand; density simulation runs only when explicitly requested.

## Smoke helpers

Use `parser.smokes` for active smoke helpers or `parser.getSmoke(entityId)` for one projectile.

```ts
import { DemoReader, EntityMode } from 'cs2parser';

const parser = new DemoReader();
parser.smokeDensityThreshold = 5; // Include cells with density > 5.
parser.on('tickend', () => {
	for (const smoke of parser.smokes) {
		console.log(smoke.seeds); // Seed world positions: { x, y, z }[]
		console.log(smoke.voxels); // Simulated cells: { x, y, z, density }[]
	}
});
await parser.parseDemo('demo.dem', { entities: EntityMode.ALL });
```

| Property | Returns |
| --- | --- |
| `entityId` | Projectile entity index |
| `detonationPos` | World-space origin as `{ x, y, z }`, or `null` |
| `hasVoxelData` | Whether journal data has arrived |
| `gridVoxels` | Last transmitted seeds: grid `x`, `y`, `z` and raw `state` bytes |
| `seeds` | Seed cell centres as world-space `{ x, y, z }` positions |
| `voxels` | Simulated world-space `{ x, y, z, density }` cells above the reader threshold |
| `getVoxels(minDensity?)` | Simulated cells with an optional threshold override |
| `voxelCount` | Number of simulated cells above the reader threshold |

The grid is 32³ cells, spaced 20 world units apart. `voxelToWorld(x, y, z, origin)`
returns `origin + (grid - 16) * 20 + 10` on each axis. Seeds are inputs to the
simulation, not the filled cloud. Reading `gridVoxels` or `seeds` decodes the seed list on demand.

`.voxels` and `.voxelCount` automatically simulate the available journal and cache
the density grid. Later reads process only new frames. Changing
`parser.smokeDensityThreshold` refilters that grid; it does not rerun simulation.
Thresholds must be finite and nonnegative; the default is 5. Returned voxel arrays
own their entries. Listing `parser.smokes` or reading `.seeds` does not simulate.

The helper uses the experimental simulation below and throws for unsupported
auxiliary records. Density values describe the grid, not rendered opacity.

## Direct density simulation (experimental)

Read `m_vSmokeDetonationPos`, `m_VoxelFrameData` and `m_nVoxelFrameDataSize` from
`CSmokeGrenadeProjectile` properties. Use the position tuple as `origin`, the byte
array as `bytes`, and the valid byte count as `size`:

```ts
import { SmokeDensitySimulation, decodeSmokeVoxelJournal, mortonEncode3 } from 'cs2parser';

const simulation = new SmokeDensitySimulation(origin);
for (const frame of decodeSmokeVoxelJournal(bytes, size)) {
	simulation.step(frame);
}
const { density } = simulation.snapshot();
console.log(density[mortonEncode3(16, 16, 16)]);
```

Create one instance per smoke lifetime. Apply every frame from sequence 0,
including heartbeats. For subsequent journal updates, apply only frames with
`frame.seq > simulation.seq`. Snapshots contain the last sequence and an owned
`Float32Array` of 32³ raw densities in X-low Morton order (128 KiB per snapshot).

Simulation supports seeding, propagation, rejection masks and stop-seeding decay.
Auxiliary 20-byte records are unsupported and throw before applying the frame.
Malformed frames and noncontiguous sequences also throw. Raw density is not
opacity; rendering, fading, bullet holes and HE shader effects are not included.

## Journal utilities

| Function | Returns |
| --- | --- |
| `decodeSmokeVoxelJournal(bytes, size?)` | Framed payloads with sequence numbers; pass the valid byte count |
| `decodeSmokeVoxelFrame(payload)` | Stop-seeding flag, optional seed replacement, rejection-word updates and raw auxiliary records |
| `getSmokeVoxelStateAt(frames, targetSeq?)` | Accumulated inputs from a contiguous prefix starting at 0; no density simulation |
| `mortonEncode3(x, y, z)` / `mortonDecode3(index)` | Conversion between grid coordinates and Morton indices |

A set rejection bit excludes a cell. Mask words overwrite previous values,
including zero. Accumulated seeds remain the last transmitted list after
stop-seeding. `countSmokeDisturbanceFrames` counts non-heartbeat records, not
bullets or HE explosions.

## Local comparison

```sh
bun scripts/verify-smoke.ts DEMO.dem /tmp/smoke-check radar.png overview.txt
```

Radar PNG and overview text are optional. Open `/tmp/smoke-check/comparison.html`
for frame stepping, seed/volume toggles and 3D viewing. Drag to orbit, wheel to
zoom, and Shift-drag or right-drag to pan. Adjust the radar plane's world-Z height
and opacity with the controls. The page works offline; 3D requires WebGL.

Copy the generated `smoke-density-N.cfg` files into CS2's `game/csgo/cfg/` folder.
Load the demo, run the displayed `demo_goto`, wait for seeking, then run the shown
`exec` command. Boxes mark boundary cells with raw density above 5; the radar is
a flat reference image. Displayed ticks are the first demo ticks carrying each
journal frame, not exact render timestamps.

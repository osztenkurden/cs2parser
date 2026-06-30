# CS2 smoke voxel data (`CSmokeGrenadeProjectile.m_VoxelFrameData`)

Reverse-engineered from `client.dll` (CS2 build 2026-05, Ghidra) and cross-checked
byte-for-byte against `full_demo.dem`. Covers the on-the-wire layout of the
volumetric-smoke voxel stream.

## Networked members (schema offsets in `C_SmokeGrenadeProjectile`)

| Field | Offset | Wire type | Meaning |
|---|---|---|---|
| `m_vSmokeDetonationPos` | 0x1268 | Vector | World-space detonation centre (grid origin anchor) |
| `m_VoxelFrameData` | 0x1278 | `CNetworkUtlVectorBase<uint8>` | The voxel **journal** (byte stream below) |
| `m_nVoxelFrameDataSize` | 0x1290 | int32 | Number of **valid** bytes in the journal (≤ vector capacity) |
| `m_nVoxelUpdate` | 0x1294 | int32 | Monotonic update counter (frames appended) |

`m_VoxelFrameData` is allocated to a fixed capacity (3072 B observed) but only the
first `m_nVoxelFrameDataSize` bytes are meaningful.

## Outer layer — the journal  ✅ fully decoded & verified

`m_VoxelFrameData[0 .. m_nVoxelFrameDataSize)` is a concatenation of **frame
records**, one per server frame the smoke has existed for:

```
record := u16 frameSeq   (little-endian)
          u16 payloadLen  (little-endian, bytes)
          u8  payload[payloadLen]
```

The client (`SmokeVolume::…`, `FUN_180755030`) keeps a 16-bit "current frame"
counter and **replays** records in order: it skips records whose `frameSeq` is
below the counter, decodes the one that matches, advances the counter, and stops
at the first future record. So to reconstruct the smoke at frame *N* you replay
records `0..N`.

Verified on `full_demo.dem`: across all 67 smokes that carried voxel data, the
records tile the buffer exactly up to `m_nVoxelFrameDataSize` with strictly
monotonic `frameSeq` (0,1,2,…). Typical journal: one large initial frame
(~760–840 B) then mostly 3-byte heartbeats with occasional 15–55 B edit frames
when the cloud is disturbed (bullets / HE / molotov).

`decodeSmokeVoxelJournal()` in `src/helpers/smokeVoxel.ts` implements this layer.

## Per-frame payload — decoded (occupancy section)

The payload is read with Valve's bit reader, but every field used by the
occupancy section is byte-aligned, so it parses as plain bytes. From
`FUN_180756800`:

1. `u8 activeFlag`
2. `u8 sectionFlags` — bit 0 → occupancy list; bit 1 → extended per-cell block.
3. If bit 0 (a **full replacement** of the active voxel set — the client clears
   the previous set first):
   ```
   u8 count
   count × 8-byte entries:  [0]=z  [1]=y  [2]=x   [3..7]=state (5 bytes)
   ```
   Each `(x,y,z)` is folded into a linear grid index with a **3D Morton /
   Z-order curve** (masks `0x300f00f`, `0x30c30c3`, `0x9249249`), and the
   occupancy byte at `gridBase + 0x103008 + morton` is set to 1.
4. Bit 1 section: `(u10 index, 8-byte value)` pairs at `gridBase + 8 + index*8`
   — extended per-cell data (density/colour). Not needed for occupancy; skipped.

In practice CS2 sends the occupancy list **once** (frame `seq == 0`, ~44 "seed"
voxels around the detonation); the client then runs the fluid simulation
(`FUN_180753ea0`, the `SmokeFluidA` texture) to grow the rendered volume. So the
networked voxels are the *seed/occlusion set*, not the full rendered cloud — but
they pin the smoke's location and extent.

`decodeVoxelFrameOccupancy()` / `getSmokeOccupancyAt()` in
`src/helpers/smokeVoxel.ts` decode this; verified on `full_demo.dem` (67/67
smokes, all coords in `[0,32)`).

### Grid + world transform  ✅ recovered

- **32 × 32 × 32** voxels (5 bits/axis). Confirmed by the fluid texture
  descriptor `0x0001_0020_0020_021e` and `SmokeFluidA%dx%dx%d` /
  `IndirectVoxelDim{X,Y,Z}`.
- Morton index: `idx = spread(z) | spread(y)<<1 | spread(x)<<2`.
- **World transform** (from `FUN_18076e460`): `grid = (world − origin)·0.05 + 16`,
  where the scale `DAT_18192dc50 = 0.05` voxels/unit → **20 world units per
  voxel**, and `+16` centres the 32-wide grid on the detonation origin. Inverse:
  ```
  world = (gridXYZ − 16) · 20 + detonationPos
  ```
  `voxelToWorld()` implements this. **Axis mapping (verified on a radar):**
  identity sources (world X←voxel x, Y←voxel y, Z←voxel z) with signs
  `[-1, +1, +1]` — i.e. world X is mirrored relative to the grid, Y and Z align.
  Baked in as `VOXEL_AXIS_SIGN`.

## Tools

- `SmokeHelper` (`src/helpers/smoke.ts`) — entity helper for a deployed smoke;
  `parser.smokes` / `parser.getSmoke(id)`. Getters: `detonationPos`, `voxels`
  (world positions, computed on demand), `gridVoxels` (grid coords), `voxelCount`,
  `hasVoxelData`. Wraps the decode below — most consumers want this.
- `scripts/dump-smoke-voxels.ts` — parse a demo, capture one seed-occupancy frame
  per smoke (round/tick/detonation/voxels + map name) via `SmokeHelper`, write
  `tools/smoke-dump.json`, and print a CLI table to pick a smoke by round/tick.
- `tools/smoke-viewer.html` — loads the dump, renders voxels on a radar, with live
  debug controls (radar calibration, voxel size, grid centre, per-axis mapping &
  sign) to dial in the transform visually.

## Still open

- Exact bit-layout of the bit-1 extended per-cell block (density/colour) — not
  required for occupancy/location.
- The Z (height) sign is only weakly confirmed (a radar is 2D); X and Y are
  confirmed by position. `+Z` is the natural default and looked correct.

## Source functions (client.dll, this build)

| Addr | Role |
|---|---|
| `FUN_18076dfb0` | entry: reads members, picks size, calls the parser |
| `FUN_180755030` | journal walker / frame selector |
| `FUN_180756800` | per-frame payload decoder (Morton occupancy + sections) |
| `SmokeVolume::GetSmokeDensityInLine` / `GetSmokeDensityLOS` | query density along a ray (LOS) |

RE scripts live in `scripts/re/` (Ghidra headless + Java post-scripts).

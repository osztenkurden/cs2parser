/**
 * Smoke probe: validates the array/vector decode fix on a real demo.
 *
 *   bun scripts/probe-array-decoding.ts [path]   (default: ag2_demo.dem)
 *
 * Reports a few representative container fields (vector-of-struct, vector-of-
 * primitive, fixed-size primitive array) and checks that they hold non-trivial
 * array values instead of last-write-wins scalars.
 */
import path from 'path';
import { DemoReader, EntityMode } from '../src/index.js';

const demo = process.argv[2] ?? path.join(process.cwd(), 'ag2_demo.dem');

const parser = new DemoReader();
let tickCount = 0;
let lastTick = -1;
parser.on('tickstart', t => {
	tickCount++;
	lastTick = t;
});
parser.on('end', e => {
	console.log(`Parser end: incomplete=${e.incomplete}, reason=${e.reason}, error=${e.error}, tickCount=${tickCount}, lastTick=${lastTick}`);
});
await parser.parseDemo(demo, { entities: EntityMode.ALL, stream: false });

const controllers = parser.entities.filter(e => e?.className === 'CCSPlayerController');
console.log(`Found ${controllers.length} controllers. currentTick=${parser.currentTick}`);
const KILLS_KEY = 'CCSPlayerController.CCSPlayerController_ActionTrackingServices.m_iKills';
const controller =
	controllers.find(c => {
		const k = (c.properties as Record<string, unknown>)[KILLS_KEY] as number | undefined;
		return (k ?? 0) > 0;
	}) ?? controllers[0];
if (!controller) {
	console.error('No CCSPlayerController found in demo.');
	process.exit(1);
}
const cp = controller.properties as Record<string, unknown>;
console.log(`Selected controller name=${cp['CCSPlayerController.m_iszPlayerName']} lifetime_kills=${cp[KILLS_KEY]}`);

// Dump non-zero per-round entries for ALL controllers — proves per-element distinctness end-to-end.
console.log('\nPer-round non-zero stats across ALL controllers:');
let printed = 0;
for (const c of controllers) {
	const props = c.properties as Record<string, unknown>;
	const name = props['CCSPlayerController.m_iszPlayerName'];
	const stats = props['CCSPlayerController.CCSPlayerController_ActionTrackingServices.m_perRoundStats'];
	if (!Array.isArray(stats)) continue;
	for (let i = 0; i < stats.length; i++) {
		const el = stats[i] as Record<string, unknown> | undefined;
		if (!el) continue;
		const k = (el.m_iKills as number) ?? 0;
		const d = (el.m_iDeaths as number) ?? 0;
		const dmg = (el.m_iDamage as number) ?? 0;
		if (k > 0 || d > 0 || dmg > 0) {
			console.log(`  ${name} round[${i}] kills=${k} deaths=${d} damage=${dmg}`);
			if (++printed >= 20) break;
		}
	}
	if (printed >= 20) break;
}
if (printed === 0) console.log('  (none — demo may be entirely pre-action or a single snapshot tick)');

// Sweep: classify every propId — scalar / container-of-value / container-of-struct / typed-array.
let scalar = 0;
let vecValue = 0;
let vecStruct = 0;
let typedArr = 0;
let withFixed = 0;
const missing: string[] = [];
for (const [idStr, name] of Object.entries(parser.propIdToName)) {
	const info = parser.propIdToInfo[Number(idStr)];
	if (!info) {
		missing.push(name);
		continue;
	}
	if (info.containerKey) {
		if (info.subKey) vecStruct++;
		else if (info.elementCtor) typedArr++;
		else vecValue++;
		if (info.fixedLength !== undefined) withFixed++;
	} else {
		scalar++;
	}
}
console.log('\nPropId classification across the demo schema:');
console.log(`  scalar:               ${scalar}`);
console.log(`  container-of-value:   ${vecValue}  (plain JS arrays)`);
console.log(`  container w/ typed:   ${typedArr}  (Uint8Array / Int32Array / Float32Array / ...)`);
console.log(`  container-of-struct:  ${vecStruct}  (sub-fields of vector-of-serializer)`);
console.log(`  fixed-length total:   ${withFixed}`);
if (missing.length) console.log(`  WARNING: ${missing.length} propIds had no PropInfo (e.g. ${missing[0]})`);

// Distinct element type hints across all containers (helps spot unhandled types).
const elementTypeHints = new Map<string, { count: number; typed: boolean; sample: string }>();
for (const [idStr, name] of Object.entries(parser.propIdToName)) {
	const info = parser.propIdToInfo[Number(idStr)];
	if (!info?.containerKey || info.subKey) continue;
	const hint = info.elementTsHint ?? '<unknown>';
	const slot = elementTypeHints.get(hint);
	if (slot) slot.count++;
	else elementTypeHints.set(hint, { count: 1, typed: !!info.elementCtor, sample: name });
}
console.log('\nDistinct container element types (hint → {count, typed?}):');
for (const [hint, { count, typed, sample }] of [...elementTypeHints.entries()].sort((a, b) => b[1].count - a[1].count)) {
	console.log(`  ${hint.padEnd(28)} count=${count.toString().padStart(4)} typed=${typed}  e.g. ${sample}`);
}

// Look at a container that should have non-trivial values regardless of round state.
console.log('\nm_vecServerAuthoritativeWeaponSlots samples:');
for (const c of controllers.slice(0, 3)) {
	const props = c.properties as Record<string, unknown>;
	const name = props['CCSPlayerController.m_iszPlayerName'];
	const slots = props['CCSPlayerController.CCSPlayerController_InventoryServices.m_vecServerAuthoritativeWeaponSlots'];
	if (Array.isArray(slots)) {
		const nonEmpty = slots.filter(s => s && Object.keys(s as object).length > 0);
		console.log(`  ${name}: total=${slots.length} non-empty=${nonEmpty.length}`);
		for (let i = 0; i < Math.min(slots.length, 3); i++) {
			console.log(`    [${i}]: ${JSON.stringify(slots[i])}`);
		}
	}
}

// Look at the attributes container on a weapon (vector-of-serializer).
const weapon = parser.entities.find(e => e?.className === 'CWeaponXM1014');
if (weapon) {
	const attrs = (weapon.properties as Record<string, unknown>)['CWeaponXM1014.m_Attributes'];
	console.log('\nCWeaponXM1014.m_Attributes:');
	if (Array.isArray(attrs)) {
		console.log(`  length: ${attrs.length}`);
		for (let i = 0; i < Math.min(attrs.length, 3); i++) {
			console.log(`  [${i}]: ${JSON.stringify(attrs[i])}`);
		}
	} else {
		console.log(`  NOT AN ARRAY: ${typeof attrs}`);
	}
}

// Survey all distinct entity classes actually present in the demo.
const classCounts = new Map<string, number>();
for (const e of parser.entities) {
	if (!e) continue;
	classCounts.set(e.className, (classCounts.get(e.className) ?? 0) + 1);
}
console.log('\nDistinct entity classes present in demo:');
for (const [k, n] of [...classCounts.entries()].sort((a, b) => b[1] - a[1])) {
	if (k.includes('Inferno') || k.includes('Fog') || k.includes('Sky') || k.includes('Visib')) {
		console.log(`  ${k}: ${n}`);
	}
}

// CFogController etc.: fixed Vector[N] field localSound
// m_recentKillQueue (uint8[8] fixed array on CCSPlayerController) — should hold distinct values.
console.log('\nm_recentKillQueue samples (uint8[8] fixed array):');
for (const c of controllers) {
	const props = c.properties as Record<string, unknown>;
	const name = props['CCSPlayerController.m_iszPlayerName'];
	const q = props['CCSPlayerController.m_recentKillQueue'];
	if (q instanceof Uint8Array) {
		console.log(`  ${name}: ${q.constructor.name} len=${q.length} values=[${[...q].join(',')}]`);
	} else {
		// Some controllers might not have this set yet
		const keys = Object.keys(props).filter(k => k.includes('recentKill'));
		console.log(`  ${name}: <not Uint8Array, found keys: ${keys.join(', ')}>`);
	}
}

// localSound is a Vector[N] inside the camera-services sub-serializer of CCSPlayerPawn.
const pawnForSound = parser.entities.find(e => e?.className === 'CCSPlayerPawn');
if (pawnForSound) {
	const props = pawnForSound.properties as Record<string, unknown>;
	for (const key of Object.keys(props)) {
		if (key.endsWith('.localSound')) {
			const ls = props[key];
			if (Array.isArray(ls)) {
				console.log(`\n${key} (Vector[N] fixed array): len=${ls.length}`);
				for (let i = 0; i < ls.length; i++) {
					console.log(`  [${i}]: ${JSON.stringify(ls[i])}`);
				}
			}
		}
	}
}

// Verify CNetworkUtlVectorBase<ResourceId_t> stores actual 64-bit bigint values.
console.log('\nResourceId_t container samples (CNetworkUtlVectorBase<ResourceId_t>):');
let resourceIdSamples = 0;
for (const e of parser.entities) {
	if (!e || resourceIdSamples >= 3) continue;
	const props = e.properties as Record<string, unknown>;
	for (const key of Object.keys(props)) {
		const v = props[key];
		if (v instanceof BigUint64Array && v.length > 0) {
			const nonZero = [...v].filter(b => b !== 0n).length;
			console.log(`  ${e.className}.${key}: BigUint64Array len=${v.length} non-zero=${nonZero}`);
			if (nonZero > 0) console.log(`    first non-zero: 0x${[...v].find(b => b !== 0n)!.toString(16)}`);
			resourceIdSamples++;
			if (resourceIdSamples >= 3) break;
		}
	}
}
if (resourceIdSamples === 0) console.log('  (no BigUint64Array containers populated in this demo)');

// Count standalone ResourceId_t fields decoded (decoder ID 4 = D_UNSIGNED64).
// Pre-fix these would have silently truncated to uint32.
let standaloneResourceId = 0;
let anyBigintScalar = 0;
for (const [idStr, name] of Object.entries(parser.propIdToName)) {
	const info = parser.propIdToInfo[Number(idStr)];
	const dec = parser.propIdToDecoder[Number(idStr)];
	if (info?.containerKey) continue;
	if (dec === 4) anyBigintScalar++;
	if (name.includes('ResourceId') || name.includes('Resource_t')) standaloneResourceId++;
}
console.log(`\nStandalone bigint scalar propIds (decoder=Unsigned64): ${anyBigintScalar}`);
console.log(`Standalone ResourceId_t-named propIds: ${standaloneResourceId}`);

// CInferno: fixed Vector[64] array of fire positions.
const inferno = parser.entities.find(e => e?.className === 'CInferno');
if (inferno) {
	const ip = inferno.properties as Record<string, unknown>;
	console.log('\nCInferno arrays:');
	for (const key of ['CInferno.m_firePositions', 'CInferno.m_fireParentPositions', 'CInferno.m_bFireIsBurning', 'CInferno.m_BurnNormal']) {
		const v = ip[key];
		if (Array.isArray(v)) {
			const nonZero = v.filter(x => x && (Array.isArray(x) ? x.some(n => n !== 0) : x !== false && x !== 0)).length;
			console.log(`  ${key}: len=${v.length} non-empty=${nonZero}`);
			for (let i = 0; i < Math.min(v.length, 3); i++) {
				console.log(`    [${i}]: ${JSON.stringify(v[i])}`);
			}
		} else {
			console.log(`  ${key}: ${typeof v} ${JSON.stringify(v)}`);
		}
	}
	console.log(`  CInferno.m_fireCount: ${ip['CInferno.m_fireCount']}`);
}


const ats = (controller.properties as Record<string, unknown>)[
	'CCSPlayerController.CCSPlayerController_ActionTrackingServices.m_perRoundStats'
];
console.log('CCSPlayerController.m_perRoundStats:');
if (Array.isArray(ats)) {
	console.log(`  length: ${ats.length}`);
	const distinctKills = new Set<number | undefined>();
	const distinctDmg = new Set<number | undefined>();
	for (let i = 0; i < ats.length; i++) {
		const el = ats[i] as Record<string, unknown> | undefined;
		distinctKills.add(el?.m_iKills as number | undefined);
		distinctDmg.add(el?.m_iDamage as number | undefined);
	}
	console.log(`  distinct m_iKills values across rounds: ${distinctKills.size}`);
	console.log(`  distinct m_iDamage values across rounds: ${distinctDmg.size}`);
	const last = ats[ats.length - 1] as Record<string, unknown> | undefined;
	console.log(`  LAST element: ${JSON.stringify(last)}`);
} else {
	console.log(`  NOT AN ARRAY: ${String(ats)}`);
}

// Sample a few primitive-vector fields across entities.
const primitiveVectors = new Set<string>();
for (const [, name] of Object.entries(parser.propIdToName)) {
	const info = parser.propIdToInfo[Number(Object.entries(parser.propIdToName).find(([, v]) => v === name)?.[0] ?? -1)];
	if (info?.elementCtor && !info.subKey) primitiveVectors.add(info.containerKey ?? name);
}

console.log('\nPrimitive-vector / typed-array fields encountered (first 6):');
let shown = 0;
for (const ent of parser.entities) {
	if (!ent) continue;
	const props = ent.properties as Record<string, unknown>;
	for (const key of Object.keys(props)) {
		if (!primitiveVectors.has(key)) continue;
		const v = props[key];
		if (v && typeof v === 'object' && ('length' in (v as object))) {
			const isTyped = ArrayBuffer.isView(v);
			const arr = v as { length: number };
			console.log(
				`  ${ent.className}.${key}: ${isTyped ? 'TypedArray' : 'Array'} len=${arr.length} ctor=${(v as object).constructor.name}`
			);
			shown++;
			if (shown >= 6) break;
		}
	}
	if (shown >= 6) break;
}

// Verify a Vec3 scalar (NOT an array) still decodes as a tuple
const pawn = parser.entities.find(e => e?.className === 'CCSPlayerPawn');
if (pawn) {
	const rot = (pawn.properties as Record<string, unknown>)['CCSPlayerPawn.CBodyComponentBaseAnimGraph.m_angRotation'];
	console.log(`\nCCSPlayerPawn.m_angRotation (should be 3-tuple, unchanged): ${JSON.stringify(rot)}`);
}


/**
 * Entity Type Generator script
 * Parses a CS2 demo file and generates TypeScript interfaces for all entity classes.
 *
 * Usage:
 *   bun scripts/generate-entity-types.ts --demo <path-to-demo>
 *   bun scripts/generate-entity-types.ts --snapshot   (use saved snapshot)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Import parsing internals
import { DemoReader } from '../src/parser/index.js';
import type { Decoder } from '../src/parser/entities/constructorFields.js';
import { EntityMode } from '../src/index.js';
import type { CDemoFileHeader } from '../src/ts-proto/demo.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, '..', 'src', 'generated');
const SNAPSHOT_PATH = path.join(OUTPUT_DIR, 'serializerSnapshot.json');
const OUTPUT_PATH = path.join(OUTPUT_DIR, 'entityTypes.ts');

// Decoder numeric ID → TypeScript type (matches constructorFields.ts D_* constants)
const DECODER_ID_TO_TS: Record<number, string> = {
	0: 'number', // D_QUANTALIZED_FLOAT
	1: '[number, number, number]', // D_VECTOR_NORMAL
	2: '[number, number, number]', // D_VECTOR_NOSCALE
	3: '[number, number, number]', // D_VECTOR_FLOAT_COORD
	4: 'bigint', // D_UNSIGNED64
	5: 'number', // D_CENTITY_HANDLE
	6: 'number', // D_NOSCALE
	7: 'boolean', // D_BOOLEAN
	8: 'string', // D_STRING
	9: 'number', // D_SIGNED
	10: 'number', // D_UNSIGNED
	11: 'boolean', // D_COMPONENT
	12: 'number', // D_FLOAT_COORD
	13: 'number', // D_FLOAT_SIMULATION_TIME
	14: 'bigint', // D_FIXED64
	15: '[number, number, number]', // D_QANGLE_PITCH_YAW
	16: '[number, number, number]', // D_QANGLE3
	17: '[number, number, number]', // D_QANGLE_VAR
	18: 'number', // D_BASE
	19: 'number', // D_AMMO
	20: '[number, number, number]', // D_QANGLE_PRES
	21: 'number', // D_GAME_MODE_RULES
	22: 'Uint8Array', // D_BINARY_BLOCK
	23: 'unknown' // D_CTRANSFORM — throws at decode; value never populated
};

function decoderToTsType(decoder: Decoder): string {
	if (typeof decoder === 'object') return 'number'; // QuantalizedFloatDecoder
	return DECODER_ID_TO_TS[decoder] ?? 'unknown';
}

type SnapshotData = {
	header: CDemoFileHeader | null;
	// serializerName → { fieldName (without serializer prefix) → tsType }
	serializers: Record<string, Record<string, string>>;
	entities: Record<string, { serializers: string[]; ownFields: Record<string, string> }>;
};

async function collectFromDemo(demoPath: string): Promise<SnapshotData> {
	const parser = new DemoReader();
	let header = null as CDemoFileHeader | null;
	parser.on('header', h => {
		header = h;
	});
	const end = await parser.parseDemo(demoPath, { entities: EntityMode.ALL, stream: false });
	if (end.status !== 'complete') throw new Error('Demo parsing did not complete; refusing to generate entity types.');

	// Build (fullPath → tsType) entries, collapsing container sub-fields into
	// `Array<{ ... }>` at the container's key and emitting typed arrays where
	// a primitive elementCtor was inferred.
	const containerSubFields = new Map<string, Map<string, string>>();
	const containerArrays = new Map<string, string>();
	const scalarFields = new Map<string, string>();

	for (const [propIdStr, fullPath] of Object.entries(parser.propIdToName)) {
		const propId = Number(propIdStr);
		const info = parser.propIdToInfo[propId];
		const decoder = parser.propIdToDecoder[propId];
		const innerTs = decoder !== undefined ? decoderToTsType(decoder) : 'unknown';

		if (info?.containerKey !== undefined) {
			if (info.subKey) {
				let group = containerSubFields.get(info.containerKey);
				if (!group) {
					group = new Map();
					containerSubFields.set(info.containerKey, group);
				}
				if (!group.has(info.subKey) || group.get(info.subKey) === 'unknown') {
					group.set(info.subKey, innerTs);
				}
			} else {
				const ts = info.elementCtor ? info.elementCtor.name : `${innerTs}[]`;
				if (!containerArrays.has(info.containerKey) || containerArrays.get(info.containerKey) === 'unknown[]') {
					containerArrays.set(info.containerKey, ts);
				}
			}
		} else {
			if (!scalarFields.has(fullPath) || scalarFields.get(fullPath) === 'unknown') {
				scalarFields.set(fullPath, innerTs);
			}
		}
	}

	const finalEntries = new Map<string, string>();
	for (const [path, ts] of scalarFields) finalEntries.set(path, ts);
	for (const [containerKey, ts] of containerArrays) finalEntries.set(containerKey, ts);
	for (const [containerKey, group] of containerSubFields) {
		const sorted = [...group.entries()].sort((a, b) => a[0].localeCompare(b[0]));
		const inner = sorted.map(([k, v]) => `readonly ${JSON.stringify(k)}?: ${v}`).join('; ');
		finalEntries.set(containerKey, `ReadonlyArray<{ ${inner} }>`);
	}

	// Shared serializer map: serializerName → { fieldNameWithoutPrefix → tsType }
	const serializerMap = new Map<string, Map<string, string>>();
	// Per-entity: className → { serializers used, own fields }
	const entityMap = new Map<string, { serializers: Set<string>; ownFields: Map<string, string> }>();

	for (const [fullPath, tsType] of finalEntries) {
		const dotIdx = fullPath.indexOf('.');
		if (dotIdx === -1) continue;

		const className = fullPath.substring(0, dotIdx);
		const suffix = fullPath.substring(dotIdx + 1);

		if (!entityMap.has(className)) {
			entityMap.set(className, { serializers: new Set(), ownFields: new Map() });
		}
		const entity = entityMap.get(className)!;

		// Determine if this is a serializer field (suffix has a segment starting with uppercase)
		const secondDotIdx = suffix.indexOf('.');
		if (secondDotIdx !== -1) {
			const firstSegment = suffix.substring(0, secondDotIdx);
			if (firstSegment[0]! >= 'A' && firstSegment[0]! <= 'Z') {
				const serializerName = firstSegment;
				entity.serializers.add(serializerName);

				if (!serializerMap.has(serializerName)) {
					serializerMap.set(serializerName, new Map());
				}
				const fields = serializerMap.get(serializerName)!;
				// Strip the serializer name prefix — store just the field part
				const fieldKey = suffix.substring(secondDotIdx + 1);
				if (!fields.has(fieldKey) || fields.get(fieldKey) === 'unknown') {
					fields.set(fieldKey, tsType);
				}
				continue;
			}
		}

		// Own field
		if (!entity.ownFields.has(suffix) || entity.ownFields.get(suffix) === 'unknown') {
			entity.ownFields.set(suffix, tsType);
		}
	}

	// Convert to serializable format
	const result: SnapshotData = { serializers: {}, entities: {}, header };
	for (const [name, fields] of serializerMap) {
		result.serializers[name] = Object.fromEntries([...fields.entries()].sort((a, b) => a[0].localeCompare(b[0])));
	}
	for (const [className, data] of entityMap) {
		result.entities[className] = {
			serializers: [...data.serializers].sort(),
			ownFields: Object.fromEntries([...data.ownFields.entries()].sort((a, b) => a[0].localeCompare(b[0])))
		};
	}
	return result;
}

function saveSnapshot(data: SnapshotData) {
	fs.mkdirSync(OUTPUT_DIR, { recursive: true });
	fs.writeFileSync(SNAPSHOT_PATH, JSON.stringify(data, null, 2));
	console.log(
		`Saved snapshot: ${SNAPSHOT_PATH} (${Object.keys(data.entities).length} entities, ${Object.keys(data.serializers).length} serializers)`
	);
}

function loadSnapshot(): SnapshotData {
	return JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf-8')) as SnapshotData;
}

type FieldMap = Record<string, string>;
type OwnNode = { name: string; classes: string[]; fields: FieldMap };

/** Nested groups smaller than this stay inline; a shared interface would not pay for itself. */
const MIN_SHARED_SHAPE = 3;

const sortFields = (fields: FieldMap): FieldMap =>
	Object.fromEntries(Object.entries(fields).sort((a, b) => a[0].localeCompare(b[0])));

/** Split `prefix.rest` keys by their first segment. Keys without a dot are left out. */
function splitByPrefix(fields: FieldMap): Map<string, FieldMap> {
	const byPrefix = new Map<string, FieldMap>();
	for (const [key, tsType] of Object.entries(fields)) {
		const dot = key.indexOf('.');
		if (dot <= 0) continue;
		const prefix = key.slice(0, dot);
		let sub = byPrefix.get(prefix);
		if (!sub) byPrefix.set(prefix, (sub = {}));
		sub[key.slice(dot + 1)] = tsType;
	}
	return byPrefix;
}

/**
 * Emit the own-field interfaces and return className → interface name.
 *
 * Three automatic passes keep the output small as classes are added:
 * 1. Classes with identical own-field sets share one interface.
 * 2. Each set extends its parent: the largest other set it strictly contains, same keys and
 *    types. On CS2 data this recovers the class hierarchy, e.g. CEnvSky < CBaseModelEntity <
 *    CBaseEntity. Parents are structural, so a parent's name can differ from the C++ base class
 *    when that base adds no fields of its own.
 * 3. Nested groups such as `m_Collision.*` whose exact shape repeats become one interface,
 *    mounted with `Prefixed<"m_Collision", ...>`.
 *
 * Every class still gets exactly the same set of keys and types; only the declarations move.
 */
function emitOwnInterfaces(
	sortedEntities: [string, { ownFields: FieldMap }][],
	lines: string[]
): Map<string, string> {
	// 1. Identical sets share a node, named after the first class in sorted order.
	const groups = new Map<string, OwnNode>();
	for (const [className, { ownFields }] of sortedEntities) {
		if (Object.keys(ownFields).length === 0) continue;
		const hash = JSON.stringify(sortFields(ownFields));
		const group = groups.get(hash);
		if (group) group.classes.push(className);
		else groups.set(hash, { name: `_${className}Own`, classes: [className], fields: ownFields });
	}
	const nodes = [...groups.values()];

	// 2. Parent inference. Strictly smaller sets only, so there are no cycles. Ties keep the
	// first candidate in sorted order, which makes the output deterministic.
	const contains = (outer: FieldMap, inner: FieldMap) =>
		Object.entries(inner).every(([key, tsType]) => Object.hasOwn(outer, key) && outer[key] === tsType);
	const parentOf = new Map<OwnNode, OwnNode>();
	for (const node of nodes) {
		const size = Object.keys(node.fields).length;
		let best: OwnNode | undefined;
		let bestSize = 0;
		for (const other of nodes) {
			const otherSize = Object.keys(other.fields).length;
			if (other === node || otherSize >= size || otherSize <= bestSize) continue;
			if (contains(node.fields, other.fields)) {
				best = other;
				bestSize = otherSize;
			}
		}
		if (best) parentOf.set(node, best);
	}
	const residualOf = new Map<OwnNode, FieldMap>();
	for (const node of nodes) {
		const parent = parentOf.get(node);
		residualOf.set(
			node,
			Object.fromEntries(Object.entries(node.fields).filter(([key]) => !parent || !Object.hasOwn(parent.fields, key)))
		);
	}

	// 3. Shared nested shapes, counted across every node's residual fields.
	const shapes = new Map<string, { fields: FieldMap; prefixUses: Map<string, number>; uses: number }>();
	for (const node of nodes) {
		for (const [prefix, sub] of splitByPrefix(residualOf.get(node)!)) {
			if (Object.keys(sub).length < MIN_SHARED_SHAPE) continue;
			const key = JSON.stringify(sortFields(sub));
			let shape = shapes.get(key);
			if (!shape) shapes.set(key, (shape = { fields: sortFields(sub), prefixUses: new Map(), uses: 0 }));
			shape.uses++;
			shape.prefixUses.set(prefix, (shape.prefixUses.get(prefix) ?? 0) + 1);
		}
	}
	const shapeName = new Map<string, string>();
	const takenNames = new Set<string>();
	for (const [key, shape] of shapes) {
		if (shape.uses < 2) continue;
		// Name after the most used prefix, alphabetical on ties: m_Collision → _CollisionFields.
		const [prefix] = [...shape.prefixUses].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]!;
		const stem = prefix.replace(/^m_/, '');
		let name = `_${stem.charAt(0).toUpperCase()}${stem.slice(1)}Fields`;
		for (let i = 2; takenNames.has(name); i++) name = `_${stem.charAt(0).toUpperCase()}${stem.slice(1)}Fields${i}`;
		takenNames.add(name);
		shapeName.set(key, name);
		lines.push(`interface ${name} {`);
		for (const [field, tsType] of Object.entries(shape.fields)) lines.push(`\treadonly "${field}"?: ${tsType};`);
		lines.push('}');
		lines.push('');
	}

	const classToOwnInterface = new Map<string, string>();
	for (const node of nodes) {
		for (const className of node.classes) classToOwnInterface.set(className, node.name);
		const residual = residualOf.get(node)!;
		const bases: string[] = [];
		const parent = parentOf.get(node);
		if (parent) bases.push(parent.name);
		const mounted = new Set<string>();
		for (const [prefix, sub] of splitByPrefix(residual)) {
			const name = shapeName.get(JSON.stringify(sortFields(sub)));
			if (name === undefined) continue;
			bases.push(`Prefixed<"${prefix}", ${name}>`);
			mounted.add(prefix);
		}
		const inline = Object.entries(residual)
			.filter(([key]) => {
				const dot = key.indexOf('.');
				return dot <= 0 || !mounted.has(key.slice(0, dot));
			})
			.sort((a, b) => a[0].localeCompare(b[0]));
		const heritage = bases.length > 0 ? ` extends ${bases.join(', ')}` : '';
		if (inline.length === 0) {
			lines.push(`interface ${node.name}${heritage} {}`);
		} else {
			lines.push(`interface ${node.name}${heritage} {`);
			for (const [field, tsType] of inline) lines.push(`\treadonly "${field}"?: ${tsType};`);
			lines.push('}');
		}
		lines.push('');
	}
	return classToOwnInterface;
}

function generateTypeScript(data: SnapshotData, demoName: string): string {
	const lines: string[] = [];
	lines.push('// AUTO-GENERATED - DO NOT EDIT');
	let line = `// Generated from demo: ${demoName} on ${new Date().toISOString().split('T')[0]}`;
	if (data.header) {
		line += ` (build: ${data.header.build_num}, patch: ${data.header.patch_version})`;
	}
	lines.push(line);
	lines.push('');

	// Utility type
	lines.push('/** Prefixes all keys of T with "P." */');
	lines.push('type Prefixed<P extends string, T> = {');
	lines.push('\treadonly [K in keyof T as K extends string ? `${P}.${K}` : never]: T[K];');
	lines.push('};');
	lines.push('');

	// Shared serializer interfaces — field keys WITHOUT serializer prefix
	const sortedSerializers = Object.entries(data.serializers).sort((a, b) => a[0].localeCompare(b[0]));
	for (const [serName, fields] of sortedSerializers) {
		lines.push(`interface _${serName} {`);
		const sortedFields = Object.entries(fields).sort((a, b) => a[0].localeCompare(b[0]));
		for (const [fieldKey, tsType] of sortedFields) {
			lines.push(`\treadonly "${fieldKey}"?: ${tsType};`);
		}
		lines.push('}');
		lines.push('');
	}

	// Sort entities
	const sortedEntities = Object.entries(data.entities).sort((a, b) => a[0].localeCompare(b[0]));

	// Own-field interfaces: shared sets, inferred parents and shared nested shapes.
	const classToOwnInterface = emitOwnInterfaces(sortedEntities, lines);

	// Entity type aliases — use nested Prefixed for serializers
	for (const [className, entityData] of sortedEntities) {
		const parts: string[] = [];
		for (const ser of entityData.serializers) {
			parts.push(`Prefixed<"${ser}", _${ser}>`);
		}
		const ownIface = classToOwnInterface.get(className);
		if (ownIface) {
			parts.push(ownIface);
		}

		const interfaceName = `I${className}`;
		if (parts.length === 0) {
			lines.push(`export interface ${interfaceName} {}`);
		} else if (parts.length === 1) {
			lines.push(`export type ${interfaceName} = Prefixed<"${className}", ${parts[0]}>;`);
		} else {
			lines.push(`export type ${interfaceName} = Prefixed<"${className}",`);
			lines.push(`\t${parts.join(' &\n\t')}`);
			lines.push('>;');
		}
		lines.push('');
	}

	// EntityTypeMap
	lines.push('/** Maps entity className to its typed properties interface */');
	lines.push('export interface EntityTypeMap {');
	for (const [className] of sortedEntities) {
		lines.push(`\t${className}: I${className};`);
	}
	lines.push('}');
	lines.push('');

	// BaseEntity
	lines.push('/** Base entity shape used at runtime */');
	lines.push('export interface BaseEntity {');
	lines.push('\tclassName: string;');
	lines.push('\tclassId: number;');
	lines.push('\tentityType: number;');
	lines.push('\tproperties: Record<string, unknown>;');
	lines.push('}');
	lines.push('');

	// Helper types — declared before TypedEntity so it can reference KnownClassName
	lines.push('/** All known entity class names */');
	lines.push('export type KnownClassName = keyof EntityTypeMap;');
	lines.push('');
	lines.push('/** Get typed properties for a known entity class name */');
	lines.push('export type EntityProperties<T extends KnownClassName> = Partial<EntityTypeMap[T]>;');
	lines.push('');

	// TypedEntity — parametric, distributes when K is a union (default: every known class)
	lines.push('/**');
	lines.push(' * Typed entity wrapper — narrows to a specific known className.');
	lines.push(' *');
	lines.push(' * With no type argument, distributes over every known className, producing a');
	lines.push(' * discriminated union suitable for narrowing on `entity.className`.');
	lines.push(' *');
	lines.push(' * @example');
	lines.push(" * type Controller = TypedEntity<'CCSPlayerController'>;");
	lines.push(' * type AnyKnown = TypedEntity; // discriminated union of all known classes');
	lines.push(' */');
	lines.push('export type TypedEntity<K extends KnownClassName = KnownClassName> = K extends KnownClassName');
	lines.push('\t? { className: K; classId: number; entityType: number; properties: Partial<EntityTypeMap[K]> }');
	lines.push('\t: never;');
	lines.push('');
	lines.push('/**');
	lines.push(' * Any entity slot — a known {@link TypedEntity} when className is in {@link EntityTypeMap},');
	lines.push(' * or {@link BaseEntity} for classes outside the generated map.');
	lines.push(' */');
	lines.push('export type AnyEntity = TypedEntity | BaseEntity;');
	lines.push('');

	// isEntityClass
	lines.push('/** Narrow an entity slot to a specific typed entity */');
	lines.push('export function isEntityClass<T extends KnownClassName>(');
	lines.push('\tentity: AnyEntity | undefined,');
	lines.push('\tclassName: T');
	lines.push('): entity is TypedEntity<T> {');
	lines.push('\treturn entity?.className === className;');
	lines.push('}');
	lines.push('');

	return lines.join('\n');
}

// Main
const args = process.argv.slice(2);
const demoIdx = args.indexOf('--demo');
const useSnapshot = args.includes('--snapshot');

if (demoIdx !== -1 && args[demoIdx + 1]) {
	const demoPath = args[demoIdx + 1]!;
	console.log(`Parsing demo: ${demoPath}...`);
	const data = await collectFromDemo(demoPath);
	saveSnapshot(data);

	const output = generateTypeScript(data, path.basename(demoPath));
	fs.mkdirSync(OUTPUT_DIR, { recursive: true });
	fs.writeFileSync(OUTPUT_PATH, output);
	console.log(
		`Generated: ${OUTPUT_PATH} (${Object.keys(data.entities).length} entities, ${Object.keys(data.serializers).length} shared serializers)`
	);
} else if (useSnapshot) {
	if (!fs.existsSync(SNAPSHOT_PATH)) {
		console.error('No snapshot found. Run with --demo <path> first.');
		process.exit(1);
	}
	console.log('Loading snapshot...');
	const data = loadSnapshot();
	const output = generateTypeScript(data, 'snapshot');
	fs.mkdirSync(OUTPUT_DIR, { recursive: true });
	fs.writeFileSync(OUTPUT_PATH, output);
	console.log(
		`Generated: ${OUTPUT_PATH} (${Object.keys(data.entities).length} entities, ${Object.keys(data.serializers).length} shared serializers)`
	);
} else {
	console.error('Usage:');
	console.error('  bun scripts/generate-entity-types.ts --demo <path-to-demo>');
	console.error('  bun scripts/generate-entity-types.ts --snapshot');
	process.exit(1);
}

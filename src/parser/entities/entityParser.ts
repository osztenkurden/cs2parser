import type { CSVCMsg_PacketEntities } from '../../ts-proto/netmessages.js';
import { BitBuffer } from '../ubitreader.js';
import type { ClassInfo } from './classInfo.js';
import {
	constructorFieldHelper,
	Decoders,
	FieldTypeEnum,
	type Decoder,
	type Field,
	type PropInfo,
	type SerializerN,
	type TypedArray
} from './constructorFields.js';
import { generateEnum, type GetEnumType } from './brandedEnum.js';
import type { FieldPath } from './fieldPathOps.js';
import { parsePaths } from './fieldPaths.js';
import { type emit } from './types.js';

const NSERIALBITS = 17;

const EntityTypeEnum = generateEnum(
	{
		PlayerController: 0,
		Rules: 1,
		Projectile: 2,
		Team: 3,
		Normal: 4,
		C4: 5
	},
	'entityType'
);
export type EntityTypeEnum = GetEnumType<typeof EntityTypeEnum>;

export type Entity = {
	entityId: number;
	classId: number;
	entityType: EntityTypeEnum;
};

const getEntityType = (name: string) => {
	if (name === 'CCSPlayerController') return EntityTypeEnum.PlayerController;
	if (name === 'CCSGameRulesProxy') return EntityTypeEnum.Rules;
	if (name === 'CTeam') return EntityTypeEnum.Team;
	if (name === 'CC4') return EntityTypeEnum.C4;

	if (name.includes('Projectile') || name === 'CIncendiaryGrenade') return EntityTypeEnum.Projectile;

	return EntityTypeEnum.Normal;
};

type FieldPlan = {
	meta: PropInfo | undefined;
	decoder: Decoder;
	propId: number;
	isResize: boolean;
	indexDepth: number;
	children: (FieldPlan | null)[] | null;
	element: FieldPlan | null;
	pathError: string;
};

// Resolve metadata from this demo's class-local fields, never from serializer names
// or generated snapshots. Plans belong to one EntityParser and hold no entity storage.
const planField = (field: Field, depth: number, indexDepth: number, propInfo: (PropInfo | undefined)[]): FieldPlan => {
	const plan: FieldPlan = {
		meta: undefined,
		decoder: Decoders.UnsignedDecoder,
		propId: -1,
		isResize: false,
		indexDepth: -1,
		children: null,
		element: null,
		pathError: 'ILLEGAL PATH #3'
	};
	switch (field.type) {
		case FieldTypeEnum.Value: {
			const value = (field as Field<typeof FieldTypeEnum.Value>).value;
			plan.decoder = value.decoder;
			plan.propId = value.prop_id;
			plan.indexDepth = indexDepth;
			break;
		}
		case FieldTypeEnum.Array:
		case FieldTypeEnum.Vector: {
			const value = (field as Field<typeof FieldTypeEnum.Array | typeof FieldTypeEnum.Vector>).value;
			// Nested containers retain the existing outermost-element indexing behavior.
			plan.element = planField(value.field_enum, depth + 1, indexDepth === -1 ? depth + 1 : indexDepth, propInfo);
			if (field.type === FieldTypeEnum.Vector && value.field_enum.type === FieldTypeEnum.Value) {
				plan.propId = plan.element.propId;
				plan.isResize = true;
			}
			break;
		}
		case FieldTypeEnum.Serializer:
		case FieldTypeEnum.Pointer: {
			const value = (field as Field<typeof FieldTypeEnum.Serializer | typeof FieldTypeEnum.Pointer>).value;
			plan.children = value.serializer.fields.map(child =>
				child ? planField(child, depth + 1, indexDepth, propInfo) : null
			);
			plan.pathError = field.type === FieldTypeEnum.Pointer ? 'ILLEGAL PATH #2x' : 'ILLEGAL PATH #1';
			if (field.type === FieldTypeEnum.Pointer)
				plan.decoder = (field as Field<typeof FieldTypeEnum.Pointer>).value.decoder;
			break;
		}
	}
	plan.meta = plan.propId === -1 ? undefined : propInfo[plan.propId];
	return plan;
};

const GROWTH_FALLBACK = 32;

// TypedArray.set has incompatible parameter types across the union
// (ArrayLike<number> vs ArrayLike<bigint>). Caller guarantees both args come
// from the same elementCtor, so the call is safe at runtime.
const copyTyped = (dst: TypedArray, src: TypedArray) => {
	(dst as Uint8Array).set(src as unknown as Uint8Array);
};

const writeToContainer = (props: Record<string, unknown>, info: PropInfo, arrayIndex: number, value: unknown) => {
	const key = info.containerKey!;
	let arr = props[key] as unknown[] | TypedArray | undefined;
	if (arr === undefined) {
		if (info.elementCtor) {
			const len = info.fixedLength ?? Math.max(GROWTH_FALLBACK, arrayIndex + 1);
			arr = new info.elementCtor(len);
		} else {
			arr = new Array(info.fixedLength ?? 0);
		}
		props[key] = arr;
	}
	// Grow typed arrays for dynamic vectors when the element index is out of range
	// (the resize message normally arrives first, but element-before-resize is possible).
	if (info.elementCtor && info.fixedLength === undefined && arrayIndex >= (arr as TypedArray).length) {
		const newLen = Math.max((arr as TypedArray).length * 2, arrayIndex + 1);
		const grown = new info.elementCtor(newLen);
		copyTyped(grown, arr as TypedArray);
		props[key] = grown;
		arr = grown;
	}
	if (info.subKey !== undefined) {
		const plain = arr as unknown[];
		let elem = plain[arrayIndex] as Record<string, unknown> | undefined;
		if (!elem) {
			elem = {};
			plain[arrayIndex] = elem;
		}
		elem[info.subKey] = value;
	} else if (info.elementCtor) {
		(arr as TypedArray)[arrayIndex] = value as number;
	} else {
		(arr as unknown[])[arrayIndex] = value;
	}
	return arr;
};

const resizeContainer = (props: Record<string, unknown>, info: PropInfo, newLen: number) => {
	const key = info.containerKey ?? info.name;
	const existing = props[key];
	if (info.elementCtor) {
		const next = new info.elementCtor(newLen);
		if (existing && (existing as TypedArray).buffer instanceof ArrayBuffer) {
			const prev = existing as TypedArray;
			copyTyped(next, prev.subarray(0, Math.min(prev.length, newLen)) as TypedArray);
		}
		props[key] = next;
	} else if (Array.isArray(existing)) {
		existing.length = newLen;
	} else {
		props[key] = new Array(newLen);
	}
};

/**
 * Apply a decoded entity-field update to an entity's `properties` bag. Dispatches
 * to the right storage helper based on `meta`/`arrayIndex`/`isResize`:
 *   - resize message  → grow / shrink the container at `meta.containerKey`
 *   - container write → assign element at `meta.containerKey`[`arrayIndex`]
 *                       (with `meta.subKey` for vector-of-serializer sub-fields)
 *   - scalar write    → assign `props[meta.name]`
 *
 * Shared by direct updates and the `entityupdated` listener. Consecutive direct
 * container writes have an update-local fast path; allocation and growth still
 * go through writeToContainer.
 */
export const applyPropUpdate = (
	props: Record<string, unknown>,
	meta: PropInfo,
	value: unknown,
	arrayIndex: number,
	isResize: boolean
) => {
	if (isResize) {
		resizeContainer(props, meta, value as number);
	} else if (meta.containerKey !== undefined && arrayIndex !== -1) {
		writeToContainer(props, meta, arrayIndex, value);
	} else {
		props[meta.name] = value;
	}
};

export class EntityParser {
	private updates: FieldPlan[] = [];
	private arrayIndices: number[] = [];
	private plans = new WeakMap<SerializerN, (FieldPlan | null)[]>();
	private planSerializer: SerializerN | null = null;
	private planRoots: (FieldPlan | null)[] = [];
	/** Scratch path; resolved plans and full-width indices are saved before reading any values. */
	public fieldPath: FieldPath = { path: [-1, 0, 0, 0, 0, 0, 0], last: 0 };
	private entities: { [EntityId: number]: number }; // Record<number, Entity>;
	private cachedBitBuffer = new BitBuffer(new Uint8Array(0));
	private cachedBitBuffer2 = new BitBuffer(new Uint8Array(0));
	public tick = 0;
	public directEntities:
		{ className: string; classId: number; entityType: number; properties: Record<string, unknown> }[] | null = null;
	/** Property metadata indexed by prop id for direct entity updates. */
	public directPropInfoById: (PropInfo | undefined)[] | null = null;
	public onlyGameRules = false;
	/** Width of the class-id field on entity creation. See `classIdBitWidth` in classInfo.ts. */
	private readonly classIdBits: number;
	constructor(
		private classInfo: ClassInfo,
		private enqueueEvent: emit
	) {
		this.classIdBits = classInfo.classIdBits;
		this.entities = {};
	}

	decodeEntityUpdate = (reader: BitBuffer, entityId: number, nUpdates: number) => {
		const entityClassId = this.entities[entityId];

		if (entityClassId === undefined) {
			throw new Error(`No entiy with id ${entityId}`);
		}
		const cls = this.classInfo.classes[entityClassId];

		if (!cls) {
			throw 'No class';
		}

		const updates = this.updates;
		const directEntities = this.directEntities;
		// Hoist per-entity lookups outside the hot loop: entityId is constant for this
		// call, so directEntities[entityId] cannot change between iterations.
		const ent = directEntities ? directEntities[entityId] : null;
		const entProps = ent ? ent.properties : null;
		const propNameById = this.classInfo.propNameById;
		const propInfoById = this.directPropInfoById;
		// Custom direct-write metadata still uses its own table; the normal session
		// uses the same schema metadata that was resolved when building the plans.
		const cachedMetadata = propInfoById === this.classInfo.propInfoById;
		const emitEntityUpdates = !directEntities; // emit only when no direct-write target
		// Update-local only: callers can replace properties or arrays between entity updates.
		let containerKey: string | undefined;
		let container: unknown[] | TypedArray | undefined;

		// Select the value consumer once per entity, not once per field.
		if (entProps) {
			let i = 0;
			while (i < nUpdates) {
				const info = updates[i]!;
				const arrayIndex = this.arrayIndices[i]!;
				const meta = cachedMetadata ? info.meta : info.propId !== -1 ? propInfoById![info.propId] : undefined;
				if (meta !== undefined) {
					const result = constructorFieldHelper.decode(reader, info.decoder);
					if (meta.containerKey !== undefined && arrayIndex !== -1 && !info.isResize) {
						if (
							containerKey !== meta.containerKey ||
							container === undefined ||
							(meta.elementCtor && meta.fixedLength === undefined && arrayIndex >= container.length)
						) {
							container = writeToContainer(entProps, meta, arrayIndex, result);
							containerKey = meta.containerKey;
						} else if (meta.subKey !== undefined) {
							const elements = container as Record<string, unknown>[];
							let element = elements[arrayIndex];
							if (!element) elements[arrayIndex] = element = {};
							element[meta.subKey] = result;
						} else {
							(container as unknown[])[arrayIndex] = result;
						}
					} else {
						containerKey = undefined;
						if (info.isResize) resizeContainer(entProps, meta, result as number);
						else entProps[meta.name] = result;
					}
				} else {
					constructorFieldHelper.skip(reader, info.decoder);
				}
				i++;
			}
			return i;
		}
		let i = 0;
		while (i < nUpdates) {
			const info = updates[i]!;
			const arrayIndex = this.arrayIndices[i]!;
			if (info.propId !== -1 && emitEntityUpdates && propNameById[info.propId] !== undefined) {
				const result = constructorFieldHelper.decode(reader, info.decoder);
				this.enqueueEvent('entityupdated', {
					entityId,
					propId: info.propId,
					value: result,
					arrayIndex: arrayIndex === -1 ? undefined : arrayIndex,
					isResize: info.isResize ? true : undefined
				});
			} else {
				constructorFieldHelper.skip(reader, info.decoder);
			}

			i++;
		}
		return i;
	};

	checkEntityType = (classId: number) => {
		const cls = this.classInfo.classes[classId];
		if (!cls) throw 'NO CLASS';
		return getEntityType(cls.name);
	};

	writeFp(fp_src: FieldPath, idx: number, serializer: SerializerN) {
		if (idx >= 8192) throw new Error('Too many entity field paths');
		if (this.planSerializer !== serializer) {
			let roots = this.plans.get(serializer);
			if (!roots) {
				roots = serializer.fields.map(field =>
					field ? planField(field, 0, -1, this.classInfo.propInfoById) : null
				);
				this.plans.set(serializer, roots);
			}
			this.planSerializer = serializer;
			this.planRoots = roots;
		}
		const root = this.planRoots[fp_src.path[0]];
		if (!root) throw 'Noo field';
		let plan: FieldPlan = root;
		for (let depth = 1; depth <= fp_src.last; depth++) {
			const child: FieldPlan | null | undefined = plan.element ?? plan.children?.[fp_src.path[depth]!];
			if (!child) throw plan.pathError;
			plan = child;
		}
		this.updates[idx] = plan;
		this.arrayIndices[idx] = plan.indexDepth === -1 ? -1 : fp_src.path[plan.indexDepth]!;
	}

	createEntity = (reader: BitBuffer, entityId: number, baselines: Uint8Array[]) => {
		const classId = reader.ReadUBits(this.classIdBits);

		//serial
		reader.ReadUBits(NSERIALBITS);

		reader.ReadUVarInt32();
		const entityType = this.checkEntityType(classId);
		const cls = this.classInfo.classes[classId]!;

		this.enqueueEvent('entitycreated', [entityId, classId, entityType, cls.name]);

		if (entityId > 100000) {
			throw 'Possible OOM';
		}

		this.entities[entityId] = classId;

		// For direct-write mode, also populate the DemoReader's entity immediately
		if (this.directEntities && (!this.onlyGameRules || entityType === EntityTypeEnum.Rules)) {
			this.directEntities[entityId] = {
				classId,
				entityType,
				className: cls.name,
				properties: {}
			};
		}

		if (baselines !== null) {
			const baseline = baselines[classId];
			if (baseline) {
				const baselineReader = this.cachedBitBuffer.setTo(baseline);
				this.updateEntity(baselineReader, entityId);
			}
		}
	};

	updateEntity = (reader: BitBuffer, entityId: number) => {
		const classId = this.entities[entityId];
		if (classId === undefined) throw new Error(`No entiy with id ${entityId}`);
		const cls = this.classInfo.classes[classId];
		if (!cls) throw 'No class';
		const nUpdates = parsePaths(reader, this, cls.serializer);
		this.decodeEntityUpdate(reader, entityId, nUpdates);
	};

	parseEntityPacket = (msg: CSVCMsg_PacketEntities, baseline: Uint8Array[]) => {
		const reader = this.cachedBitBuffer2.setTo(msg.entity_data!);
		const hasPvsVisBits = msg.has_pvs_vis_bits_deprecated ?? 0;

		let entityId = -1;
		const max = msg.updated_entries!;

		for (let i = 0; i < max; i++) {
			entityId += 1 + reader.readUbitVar();

			const updateType = reader.ReadUBits(2);

			if ((updateType & 0b01) !== 0) {
				if (updateType === 0b11) {
					this.entities[entityId] = undefined as any;
					if (this.directEntities) {
						this.directEntities[entityId] = undefined as any;
					}
					this.enqueueEvent('entitydeleted', entityId);
				}
			} else if (updateType === 0b10) {
				this.createEntity(reader, entityId, baseline);
				this.updateEntity(reader, entityId);
			} else {
				if (hasPvsVisBits > 0) {
					const deltaCmd = reader.ReadUBits(2);
					if ((deltaCmd & 0x1) === 1) {
						continue;
					}
				}
				this.updateEntity(reader, entityId);
			}
		}
	};
}

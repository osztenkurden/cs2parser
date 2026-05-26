import type { CSVCMsg_PacketEntities } from '../../ts-proto/netmessages.js';
import { BitBuffer } from '../ubitreader.js';
import type { ClassInfo } from './classInfo.js';
import {
	constructorFieldHelper,
	Decoders,
	FieldTypeEnum,
	getInnerExt,
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

// Reusable result object to avoid allocation per field
const _fieldResult = {
	decoder: 0 as any,
	propId: 0,
	hasInfo: false,
	arrayIndex: -1,
	isResize: false
};

// Combined findField + getPropInfo + getDecoderFromField in one pass
const findFieldAndDecode = (fp: FieldPath, ser: SerializerN) => {
	const f = ser.fields[fp.path[0]];
	if (!f) throw 'Noo field';

	// Fast path: depth-0 Value field (most common case). Must NOT take this for
	// Vector at depth 0 (that's a resize) or Array (shouldn't appear bare here).
	if (fp.last === 0 && f.type === FieldTypeEnum.Value) {
		const v = f.value as any;
		_fieldResult.decoder = v.decoder;
		_fieldResult.propId = v.prop_id;
		_fieldResult.hasInfo = true;
		_fieldResult.arrayIndex = -1;
		_fieldResult.isResize = false;
		return _fieldResult;
	}

	// Traverse to leaf field. Capture the outermost array/vector element index
	// from the path slot immediately after a container.
	let field = f;
	let arrayIndex = -1;
	for (let depth = 1; depth <= fp.last; depth++) {
		if (field.type === FieldTypeEnum.Vector || field.type === FieldTypeEnum.Array) {
			if (arrayIndex === -1) arrayIndex = fp.path[depth]!;
		}
		field = getInnerExt(field!, fp.path[depth]!);
	}

	const type = field!.type;

	if (type === FieldTypeEnum.Value) {
		const v = field.value as any;
		_fieldResult.decoder = v.decoder;
		_fieldResult.propId = v.prop_id;
		_fieldResult.hasInfo = true;
		_fieldResult.arrayIndex = arrayIndex;
		_fieldResult.isResize = false;
		return _fieldResult;
	}

	if (type === FieldTypeEnum.Vector) {
		// Path stopped AT the vector field → resize message (UVarInt32 new length).
		// PropId points at the inner element so we know which container to resize.
		_fieldResult.decoder = Decoders.UnsignedDecoder;
		const inner = getInnerExt(field, 0);
		if (inner.type === FieldTypeEnum.Value) {
			const v = inner.value as any;
			_fieldResult.propId = v.prop_id;
			_fieldResult.hasInfo = true;
			_fieldResult.arrayIndex = -1;
			_fieldResult.isResize = true;
		} else {
			_fieldResult.hasInfo = false;
			_fieldResult.arrayIndex = -1;
			_fieldResult.isResize = false;
		}
		return _fieldResult;
	}

	if (type === FieldTypeEnum.Pointer) {
		_fieldResult.decoder = (field.value as any).decoder;
		_fieldResult.hasInfo = false;
		_fieldResult.arrayIndex = -1;
		_fieldResult.isResize = false;
		return _fieldResult;
	}

	_fieldResult.decoder = Decoders.UnsignedDecoder;
	_fieldResult.hasInfo = false;
	_fieldResult.arrayIndex = -1;
	_fieldResult.isResize = false;
	return _fieldResult;
};

const GROWTH_FALLBACK = 32;

// TypedArray.set has incompatible parameter types across the union
// (ArrayLike<number> vs ArrayLike<bigint>). Caller guarantees both args come
// from the same elementCtor, so the call is safe at runtime.
const copyTyped = (dst: TypedArray, src: TypedArray) => {
	(dst as Uint8Array).set(src as unknown as Uint8Array);
};

const writeToContainer = (
	props: Record<string, unknown>,
	info: PropInfo,
	arrayIndex: number,
	value: unknown
) => {
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
 * Used by both the direct-write decode loop and the `entityupdated` event
 * listener so the two paths can't drift apart.
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
	private paths: FieldPath[];
	private entities: { [EntityId: number]: number }; // Record<number, Entity>;
	private cachedBitBuffer = new BitBuffer(new Uint8Array(0));
	private cachedBitBuffer2 = new BitBuffer(new Uint8Array(0));
	public tick = 0;
	public directEntities:
		| { className: string; classId: number; entityType: number; properties: Record<string, unknown> }[]
		| null = null;
	public directPropIdToName: Record<number, string> | null = null;
	public directPropIdToInfo: Record<number, PropInfo> | null = null;
	public onlyGameRules = false;
	constructor(
		private classInfo: ClassInfo,
		private enqueueEvent: emit
	) {
		const paths = [] as FieldPath[];
		for (let i = 0; i < 8192; i++) {
			paths.push({
				path: [0, 0, 0, 0, 0, 0, 0],
				last: 0
			});
		}
		this.paths = paths;
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

		const serializer = cls.serializer;
		const paths = this.paths;
		const directEntities = this.directEntities;
		const directPropIdToInfo = this.directPropIdToInfo;
		// Hoist per-entity lookups outside the hot loop: entityId is constant for this
		// call, so directEntities[entityId] cannot change between iterations.
		const ent = directEntities ? directEntities[entityId] : null;
		const entProps = ent ? ent.properties : null;
		const classPropIdToName = this.classInfo.propIdToName;
		const emitEntityUpdates = !directEntities; // emit only when no direct-write target

		let i = 0;
		while (i < nUpdates) {
			const path = paths[i]!;

			const info = findFieldAndDecode(path, serializer);
			const result = constructorFieldHelper.decode(reader, info.decoder);
			if (info.hasInfo) {
				if (entProps) {
					const meta = directPropIdToInfo![info.propId];
					if (meta !== undefined) {
						applyPropUpdate(entProps, meta, result, info.arrayIndex, info.isResize);
					}
				} else if (emitEntityUpdates && classPropIdToName[info.propId] !== undefined) {
					this.enqueueEvent('entityupdated', {
						entityId,
						propId: info.propId,
						value: result,
						arrayIndex: info.arrayIndex === -1 ? undefined : info.arrayIndex,
						isResize: info.isResize ? true : undefined
					});
				}
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

	writeFp(fp_src: FieldPath, idx: number) {
		const target = this.paths[idx]!;
		const last = fp_src.last;
		target.last = last;
		target.path[0] = fp_src.path[0];
		if (last >= 1) {
			target.path[1] = fp_src.path[1];
			if (last >= 2) {
				target.path[2] = fp_src.path[2];
				if (last >= 3) {
					for (let i = 3; i <= last; i++) target.path[i] = fp_src.path[i]!;
				}
			}
		}
	}

	createEntity = (reader: BitBuffer, entityId: number, baselines: Uint8Array[]) => {
		const classId = reader.ReadUBits(8);

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
		const nUpdates = parsePaths(reader, this);
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

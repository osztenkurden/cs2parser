import type { CSVCMsg_PacketEntities } from '../../ts-proto/netmessages.js';
import { BitBuffer } from '../ubitreader.js';
import type { ClassInfo } from './classInfo.js';
import { constructorFieldHelper, Decoders, FieldTypeEnum, getInnerExt, type SerializerN } from './constructorFields.js';
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
const _fieldResult = { decoder: 0 as any, propId: 0, hasInfo: false };

// Combined findField + getPropInfo + getDecoderFromField in one pass
const findFieldAndDecode = (fp: FieldPath, ser: SerializerN) => {
	const f = ser.fields[fp.path[0]];
	if (!f) throw 'Noo field';

	// Fast path: depth-0 Value field (most common case)
	if (fp.last === 0 && f.type === FieldTypeEnum.Value) {
		const v = f.value as any;
		_fieldResult.decoder = v.decoder;
		_fieldResult.propId = v.prop_id;
		_fieldResult.hasInfo = true;
		return _fieldResult;
	}

	// Traverse to leaf field
	let field = f;
	for (let depth = 1; depth <= fp.last; depth++) {
		field = getInnerExt(field!, fp.path[depth]!);
	}

	const type = field!.type;

	if (type === FieldTypeEnum.Value) {
		const v = field.value as any;
		_fieldResult.decoder = v.decoder;
		_fieldResult.propId = v.prop_id;
		_fieldResult.hasInfo = true;
		return _fieldResult;
	}

	if (type === FieldTypeEnum.Vector) {
		_fieldResult.decoder = Decoders.UnsignedDecoder;
		const inner = getInnerExt(field, 0);
		if (inner.type === FieldTypeEnum.Value) {
			const v = inner.value as any;
			_fieldResult.propId = v.prop_id;
			_fieldResult.hasInfo = true;
		} else {
			_fieldResult.hasInfo = false;
		}
		return _fieldResult;
	}

	if (type === FieldTypeEnum.Pointer) {
		_fieldResult.decoder = (field.value as any).decoder;
		_fieldResult.hasInfo = false;
		return _fieldResult;
	}

	_fieldResult.decoder = Decoders.UnsignedDecoder;
	_fieldResult.hasInfo = false;
	return _fieldResult;
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
	public onlyGameRules = false;

	// Per-classId factory that produces a `properties` object pre-populated with every
	// field name that class can carry, all set to `undefined`. Built lazily on first
	// entity create per class. The point: every entity of class X starts life with the
	// SAME hidden class, so the `entProps[name] = result` write at the hot decode site
	// (entityParser.ts:157) stays monomorphic per class instead of going megamorphic.
	private _classPropertyFactories: (() => Record<string, unknown>)[] = [];

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

	private _getPropertyFactory(classId: number): () => Record<string, unknown> {
		const cached = this._classPropertyFactories[classId];
		if (cached !== undefined) return cached;

		const cls = this.classInfo.classes[classId];
		const propIdToName = this.classInfo.propIdToName;
		let factory: () => Record<string, unknown>;

		if (!cls) {
			factory = () => ({});
		} else {
			const propIds = new Set<number>();
			constructorFieldHelper.collectClassPropIds(cls.serializer.fields, propIds, new Set<SerializerN>());

			const names: string[] = [];
			for (const id of propIds) {
				const name = propIdToName[id];
				if (name !== undefined) names.push(name);
			}

			if (names.length === 0) {
				factory = () => ({});
			} else {
				// Generate `function() { var o = {}; o["a"] = undefined; ...; return o; }`.
				// V8 sees a fixed sequence of constant-string-key writes on a fresh object,
				// which produces a stable hidden class for every entity of this class.
				const body = names.map(n => `o[${JSON.stringify(n)}]=undefined;`).join('');
				factory = new Function(`var o={};${body}return o;`) as () => Record<string, unknown>;
			}
		}

		this._classPropertyFactories[classId] = factory;
		return factory;
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
		const directPropIdToName = this.directPropIdToName;
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
					const name = directPropIdToName![info.propId];
					if (name !== undefined) entProps[name] = result;
				} else if (emitEntityUpdates && classPropIdToName[info.propId] !== undefined) {
					this.enqueueEvent('entityupdated', { entityId, propId: info.propId, value: result });
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

		// For direct-write mode, also populate the DemoReader's entity immediately.
		// Build `properties` via a per-class factory so every entity of this class
		// shares one hidden class. The hot `entProps[name] = result` write at
		// decodeEntityUpdate goes from megamorphic (each entity transitioning through
		// its own field-add sequence) to monomorphic-per-class. For classes with 100+
		// fields V8 still uses dictionary storage, so the gain is capped — measured
		// ~1% on EntityMode.ALL parses, with the hot write site dropping from 13.5%
		// to 10.5% of total CPU in the profile.
		if (this.directEntities && (!this.onlyGameRules || entityType === EntityTypeEnum.Rules)) {
			this.directEntities[entityId] = {
				classId,
				entityType,
				className: cls.name,
				properties: this._getPropertyFactory(classId)()
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

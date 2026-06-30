import type { DemoReader } from '../parser/index.js';
import type { EntityTypeMap, KnownClassName, TypedEntity } from '../generated/entityTypes.js';

/**
 * Shared base class for entity-backed helpers (Player, PlayerPawn, Team, GameRules,
 * SmokeHelper, …) and a stable extension point for user-defined helpers.
 *
 * Each subclass binds a single {@link KnownClassName} `C`, which gives:
 *   - {@link entity}: a typed snapshot of the underlying entity (`TypedEntity<C> | undefined`)
 *   - {@link prop}: a typed lookup over `EntityTypeMap[C]` keys
 *   - the protected `_num` / `_str` / `_bool` / `_bigint` / `_vec3` / `_blob` accessors,
 *     thin wrappers over the Rust-resident decoder's getter API (one Map.get for the
 *     prop_id + one FFI call each)
 *
 * Unlike the JS-parser branch, the rust branch keeps entity state inside the native
 * decoder rather than a `parser.entities` array, so reads go through the typed getters
 * above. The base does not verify `className` at access time — instances are produced by
 * {@link DemoReader} factories that already discriminate on className and the relevant
 * caches are invalidated on `entitycreated` / `entitydeleted`.
 */
export abstract class EntityHelper<C extends KnownClassName> {
	constructor(
		protected readonly _parser: DemoReader,
		public readonly entityId: number
	) {}

	/** className of the live entity at this id, or `undefined` if the slot has been freed. */
	get className(): string | undefined {
		return this._parser.getEntityClassName(this.entityId);
	}

	/**
	 * Typed snapshot of this entity, or `undefined` if the slot has been freed.
	 *
	 * Builds a fresh property snapshot (one FFI call per stored prop) — prefer the typed
	 * getters / {@link prop} on hot paths.
	 */
	get entity(): TypedEntity<C> | undefined {
		const className = this._parser.getEntityClassName(this.entityId);
		if (className === undefined) return undefined;
		const properties = this._parser.getEntity(this.entityId, className as C);
		if (properties === undefined) return undefined;
		return {
			className,
			classId: this._parser.getEntityClassId(this.entityId) ?? 0,
			entityType: this._parser.getEntityType(this.entityId) ?? 0,
			properties
		} as TypedEntity<C>;
	}

	/**
	 * Typed property accessor over `EntityTypeMap[C]`. Reads a single property by its
	 * fully-qualified key (e.g. `"CCSPlayerController.m_iszPlayerName"`) directly from the
	 * native decoder, probing the stored value's kind. Returns `undefined` when the entity /
	 * prop is unset.
	 */
	protected prop<K extends keyof EntityTypeMap[C]>(name: K): EntityTypeMap[C][K] | undefined {
		const key = name as string;
		const id = this.entityId;

		const num = this._parser.getNumberProp(id, key);
		if (num !== undefined) {
			// Bool kind is widened to 0/1 by getNumberProp — recover the boolean.
			const asBool = this._parser.getBoolProp(id, key);
			return (asBool !== undefined ? asBool : num) as EntityTypeMap[C][K];
		}
		const s = this._parser.getStringProp(id, key);
		if (s !== undefined) return s as EntityTypeMap[C][K];
		const v3 = this._parser.getVec3Prop(id, key);
		if (v3 !== undefined) return Array.from(v3) as EntityTypeMap[C][K];
		const big = this._parser.getBigIntProp(id, key);
		if (big !== undefined) return big as EntityTypeMap[C][K];
		const blob = this._parser.getBlobProp(id, key);
		if (blob !== undefined) return blob as EntityTypeMap[C][K];
		return undefined;
	}

	protected _num(name: string): number | undefined {
		return this._parser.getNumberProp(this.entityId, name);
	}
	protected _str(name: string): string | undefined {
		return this._parser.getStringProp(this.entityId, name);
	}
	protected _bool(name: string): boolean | undefined {
		return this._parser.getBoolProp(this.entityId, name);
	}
	protected _bigint(name: string): bigint | undefined {
		return this._parser.getBigIntProp(this.entityId, name);
	}
	protected _vec3(name: string): Float64Array | undefined {
		return this._parser.getVec3Prop(this.entityId, name);
	}
	protected _blob(name: string): Uint8Array | undefined {
		return this._parser.getBlobProp(this.entityId, name);
	}
	/**
	 * Read a container (vector/array) field by its fully-qualified name —
	 * a typed array, plain array, or array of structs depending on the field.
	 */
	protected _array(name: string): unknown {
		return this._parser.getArrayProp(this.entityId, name);
	}
}

import type { DemoReader } from '../parser/index.js';
import type { EntityTypeMap, KnownClassName, TypedEntity } from '../generated/entityTypes.js';

/**
 * Shared base class for entity-backed helpers (Player, PlayerPawn, Team, GameRules, …).
 *
 * Each subclass binds a single {@link KnownClassName} `C`, which gives:
 *   - {@link entity}: a typed view of the underlying entity slot (`TypedEntity<C> | undefined`)
 *   - {@link prop}: a typed lookup over `EntityTypeMap[C]` keys
 *
 * The base does not verify `className` at access time — instances are produced by
 * {@link DemoReader} factories that already discriminate on className and the relevant
 * caches are invalidated on `entitycreated` / `entitydeleted`.
 */
export abstract class EntityHelper<C extends KnownClassName> {
	constructor(
		protected readonly _parser: DemoReader,
		public readonly entityId: number
	) {}

	/** The raw, typed entity for this helper, or `undefined` if the slot has been freed. */
	get entity(): TypedEntity<C> | undefined {
		return this._parser.entities[this.entityId] as TypedEntity<C> | undefined;
	}

	/** Typed property accessor over `EntityTypeMap[C]`. */
	protected prop<K extends keyof EntityTypeMap[C]>(name: K): EntityTypeMap[C][K] | undefined {
		const props = this.entity?.properties as Partial<EntityTypeMap[C]> | undefined;
		return props?.[name];
	}
}

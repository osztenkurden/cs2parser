/**
 * Type-only probe: verifies the new TypedEntity<K> public API works for downstream
 * users — both the parametric form and the catch-all union behavior.
 *
 * Compile-only: `bun run typecheck` exercises this file. Asserts via `satisfies`
 * and conditional type checks; nothing is executed at runtime.
 */
import type {
	AnyEntity,
	BaseEntity,
	EntityProperties,
	EntityTypeMap,
	KnownClassName,
	TypedEntity
} from '../src/index.js';
import { isEntityClass, Player } from '../src/index.js';

// 1) Parametric form picks the right shape and key set.
type Controller = TypedEntity<'CCSPlayerController'>;
const _c1: Controller = {
	className: 'CCSPlayerController',
	classId: 0,
	entityType: 0,
	properties: {
		'CCSPlayerController.m_iszPlayerName': 'hubert',
		'CCSPlayerController.CCSPlayerController_InGameMoneyServices.m_iAccount': 800
	}
};

// 2) The className field is the exact literal — narrowing keeps it tight.
type ControllerClass = Controller['className'];
const _exactName: ControllerClass = 'CCSPlayerController';
// @ts-expect-error -- className is the literal, not arbitrary string
const _wrongName: ControllerClass = 'CCSTeam';

// 3) No-arg TypedEntity distributes — discriminated union, narrowable.
function narrowDistributed(e: TypedEntity) {
	if (e.className === 'CCSPlayerController') {
		// narrowed properties type
		const props: EntityProperties<'CCSPlayerController'> | undefined = e.properties;
		return props;
	}
	return null;
}
narrowDistributed satisfies (e: TypedEntity) => unknown;

// 4) AnyEntity union is what parser.entities[] yields — narrows via isEntityClass.
function narrowAny(e: AnyEntity | undefined) {
	if (isEntityClass(e, 'CCSTeam')) {
		const score: number | undefined = e.properties['CCSTeam.m_iScore'];
		return score;
	}
	return null;
}
narrowAny satisfies (e: AnyEntity | undefined) => unknown;

// 5) BaseEntity is still the catch-all shape for unknown classNames.
const _b: BaseEntity = { className: 'CSomeUnknownClass', classId: 0, entityType: 0, properties: {} };

// 6) Helpers inherit a typed `entity` getter from EntityHelper<C>.
//    Player.entity must be TypedEntity<'CCSPlayerController'> | undefined.
function _checkPlayerEntityType(player: Player) {
	const pe: TypedEntity<'CCSPlayerController'> | undefined = player.entity;
	return pe;
}
_checkPlayerEntityType satisfies (p: Player) => unknown;

// 7) Sanity check on the type map — every key resolves.
type KnownKeys = KnownClassName;
const _someKey: KnownKeys = 'CCSPlayerPawn';
type _ETM = EntityTypeMap; // ensure import compiles
type _ = _ETM;

console.log('typed-entity probe compiled');

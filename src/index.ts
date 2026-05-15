// Side-effect: load native addon at package init (Phase 0 placeholder; real
// entity-decoder wiring lands in later phases).
import './native/index.js';

export { DemoReader } from './parser/index.js';
export { EntityMode } from './parser/entities/types.js';
export type { EndReason } from './parser/entities/types.js';
export { Player } from './helpers/player.js';
export { PlayerPawn, type Vector } from './helpers/playerPawn.js';
export { Team, TeamNumber } from './helpers/team.js';
export { GameRules, WinRoundReason } from './helpers/gameRules.js';
export { isEntityClass } from './generated/entityTypes.js';
export type {
	BaseEntity,
	TypedEntity,
	EntityTypeMap,
	EntityProperties,
	KnownClassName
} from './generated/entityTypes.js';
export {
	HttpBroadcastReader,
	createDefaultFetcher,
	BroadcastProtocolError,
	BroadcastFetchError
} from './broadcast/index.js';
export type {
	HttpBroadcastOptions,
	BroadcastTerminus,
	FragmentErrorContext,
	BroadcastSyncDto,
	BroadcastFetcher,
	FetchResult
} from './broadcast/index.js';

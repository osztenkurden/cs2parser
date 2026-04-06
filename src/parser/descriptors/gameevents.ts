import {
	CMsgSource1LegacyGameEvent,
	CMsgSource1LegacyGameEventList,
	EBaseGameEvents
} from '../../ts-proto/gameevents.js';

export const gameMessages = {
	[EBaseGameEvents.GE_Source1LegacyGameEventList]: CMsgSource1LegacyGameEventList,
	[EBaseGameEvents.GE_Source1LegacyGameEvent]: CMsgSource1LegacyGameEvent
} as const;

import type { BroadcastSyncDto } from '../../broadcast/sync.js';
import type { Player } from '../../helpers/player.js';
import type { CDemoFileHeader } from '../../ts-proto/demo.js';
import type { DemoFrameEvents } from '../descriptors/decoders.js';
export type { DemoFrameEvents } from '../descriptors/decoders.js';
import type { CSGOUserCmdPB } from '../../ts-proto/cs_usercmd.js';
import type { CMsgSource1LegacyGameEventList, CMsgSource1LegacyGameEvent } from '../../ts-proto/gameevents.js';
import type { CSVCMsg_ServerInfo } from '../../ts-proto/netmessages.js';
import type { CMsgPlayerInfo } from '../../ts-proto/networkbasetypes.js';
import type { CUserMessageSayText, CUserMessageSayText2 } from '../../ts-proto/usermessages.js';
import type { NetMessageName, NetMessagePayload } from '../descriptors/generated/messageRegistry.js';
import type { OnDemandMessageName } from '../descriptors/svc.js';
import type { createStringTable, updateStringTable } from '../stringtables.js';
import type { EntityTypeEnum } from './entityParser.js';

/** Why a parse session terminated. Set on the `end` event. */
export type EndReason = 'stop' | 'timeout' | 'cancelled' | 'error';

export const EntityMode = {
	NONE: 0,
	ALL: 1,
	ONLY_GAME_RULES: 2
} as const;

export type EntityMode = (typeof EntityMode)[keyof typeof EntityMode];

/**
 * Every network message that can be listened to by name, mapped to its decoded
 * payload. The names come straight from the protobuf enums — `svc_VoiceData`,
 * `UM_SayText2`, `GE_FireBulletsId`, `CS_UM_ServerRankUpdate`, and so on.
 *
 * These are decoded only when something is listening (or when the matching
 * {@link ParseSettings} flag is set), so subscribing to a rare message costs
 * nothing on demos that don't contain it.
 */
export type OnDemandEvents = {
	[K in OnDemandMessageName]: NetMessagePayload<K>;
};

/** Payload of the catch-all `anymessage` event. */
export type RawMessage = {
	/** Protobuf enum member name, or `undefined` for an id not in the registry. */
	name: NetMessageName | undefined;
	/** Wire id as read from the packet. */
	id: number;
	/** Undecoded message body, owned by this event and safe to retain. */
	bytes: Uint8Array;
};

/**
 * One player command from `svc_UserCmds`, fully reconstructed.
 *
 * CS2 sends commands in two forms. A *full* command carries a complete
 * `CSGOUserCmdPB`; a *delta* command carries only what changed since the last
 * command for that player slot. The parser applies deltas before emitting them.
 */
export type UserCommand = {
	/** Userinfo slot the command belongs to. */
	playerSlot: number;
	/** Client-side sequence number. */
	cmdNumber: number;
	/** Client tick the command was produced on. */
	clientTick: number;
	/** Server tick the command was executed on. */
	serverTickExecuted: number;
	/**
	 * The command, with any delta already applied against the player's running
	 * state. Buttons, view angles and subtick moves live under `cmd.base`.
	 *
	 * Null only when the command could not be resolved: a delta arriving before
	 * any full command for that slot, a payload that fails to decode, or a delta
	 * using an encoding this parser doesn't recognise. After a rejected command
	 * or a subscription gap, deltas remain null until a full command restores
	 * the baseline.
	 */
	cmd: CSGOUserCmdPB | null;
	/** True when this command arrived as a delta rather than a full payload. */
	isDelta: boolean;
	/**
	 * Raw `delta_data` bytes, for callers who want the untouched payload. Null on
	 * full commands.
	 */
	deltaData: Uint8Array | null;
};

/** A chat line, resolved to a sender where possible. */
export type ChatMessage = {
	/** Sender, or null for server messages and players without a controller entity. */
	player: Player | null;
	/** Sender's userinfo entry, available without entities; null for server messages or missing userinfo. */
	playerInfo: CMsgPlayerInfo | null;
	/** Message body. */
	text: string;
	/** Which user message carried it — CS2 servers use both. */
	source: 'UM_SayText' | 'UM_SayText2';
	/** Localisation token for SayText2 (`Cstrike_Chat_All`, `Cstrike_Chat_T_Dead`, …). */
	messageName?: string;
	/** The undecorated message, if you need the other params. */
	raw: CUserMessageSayText | CUserMessageSayText2;
};

export interface OutputEvents extends OnDemandEvents, DemoFrameEvents {
	anymessage: RawMessage;
	usercommand: UserCommand;
	chat: ChatMessage;
	progress: number;
	/** 2.0 result contract: incomplete is not a success flag; inspect error too. */
	end: { incomplete: boolean; error?: any; reason?: EndReason };
	error: { error: Error };
	tickstart: number;
	tickend: number;
	header: CDemoFileHeader;
	broadcastsync: BroadcastSyncDto;
	gameeventlist: CMsgSource1LegacyGameEventList;
	gameevent: CMsgSource1LegacyGameEvent;
	clearallstringtables: never;
	createstringtable: null | NonNullable<ReturnType<typeof createStringTable>>;
	updatestringtable: NonNullable<ReturnType<typeof updateStringTable>>;
	serverinfo: CSVCMsg_ServerInfo;
	cancel: never;
	debug: string;
	entitycreated: [entityId: number, classId: number, entityType: EntityTypeEnum, className: string];
	entityupdated: {
		entityId: number;
		value: any;
		propId: number;
		/** For container fields, the element index being written. Undefined for scalar writes. */
		arrayIndex?: number;
		/** True when `value` is the new length of a `CNetworkUtlVectorBase` container. */
		isResize?: boolean;
	};
	entitydeleted: number;
}

export type emit = <T extends keyof OutputEvents>(eventName: T, ...data: OutputEvents[T][]) => void;

export type EmitQueue = (data: EventQueue, index: number, available: false) => void;

export type EventQueueElement = {
	[E in keyof OutputEvents]: [E, OutputEvents[E]];
}[keyof OutputEvents];

export type EventQueue = EventQueueElement[];

import {
	CCSUsrMsg_ServerRankRevealAll,
	CCSUsrMsg_ServerRankUpdate,
	ECstrike15UserMessages
} from '../../ts-proto/cstrike15_usermessages.js';
import {
	CSVCMsg_ClearAllStringTables,
	CSVCMsg_CreateStringTable,
	// CSVCMsg_FlattenedSerializer,
	CSVCMsg_PacketEntities,
	CSVCMsg_ServerInfo,
	CSVCMsg_UpdateStringTable,
	CSVCMsg_UserCommands,
	CSVCMsg_UserMessage,
	CSVCMsg_VoiceData,
	SVC_Messages
} from '../../ts-proto/netmessages.js';
import { CUserMessageSayText2, EBaseUserMessages } from '../../ts-proto/usermessages.js';
import { CNETMsg_SetConVar, NET_Messages } from '../../ts-proto/networkbasetypes.js';
import type { OptionalMessagesId, RevertKeysAndValues } from '../entities/types.js';

//import ImportedCLCMessages = ;

export const svcMessages = {
	[SVC_Messages.svc_PacketEntities]: CSVCMsg_PacketEntities,
	[SVC_Messages.svc_ServerInfo]: CSVCMsg_ServerInfo,
	[SVC_Messages.svc_CreateStringTable]: CSVCMsg_CreateStringTable,
	[SVC_Messages.svc_UpdateStringTable]: CSVCMsg_UpdateStringTable,
	[SVC_Messages.svc_ClearAllStringTables]: CSVCMsg_ClearAllStringTables
} as const;

export const optionalSvcMessages = {
	[SVC_Messages.svc_VoiceData]: CSVCMsg_VoiceData,
	[ECstrike15UserMessages.CS_UM_ServerRankRevealAll]: CCSUsrMsg_ServerRankRevealAll,
	[ECstrike15UserMessages.CS_UM_ServerRankUpdate]: CCSUsrMsg_ServerRankUpdate,
	[EBaseUserMessages.UM_SayText2]: CUserMessageSayText2,
	[SVC_Messages.svc_UserCmds]: CSVCMsg_UserCommands,
	[SVC_Messages.svc_UserMessage]: CSVCMsg_UserMessage,
	// NET-layer message: the server's replicated convars (game_type, game_mode, mp_*, …). Sent in
	// the signon stream and on change. Opt in with `{ net_SetConVar: true }`; listen on 'net_SetConVar'.
	[NET_Messages.net_SetConVar]: CNETMsg_SetConVar
} as const;

type svcIdToName = RevertKeysAndValues<OptionalMessagesId>;
type OptionalSvcIdToName = { [K in keyof typeof optionalSvcMessages]: svcIdToName[K] };

export const optionalSvcIds: OptionalSvcIdToName = Object.entries({
	...SVC_Messages,
	...ECstrike15UserMessages,
	...EBaseUserMessages,
	...NET_Messages
}).reduce(
	(prev, curr) => (curr[1] in optionalSvcMessages ? { ...prev, [curr[1]]: curr[0] } : prev),
	{} as OptionalSvcIdToName
);

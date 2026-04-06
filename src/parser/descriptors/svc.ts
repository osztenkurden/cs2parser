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
import type { IdToName } from '../entities/types.js';

//import ImportedCLCMessages = ;

export const svcMessages = {
	[SVC_Messages.svc_PacketEntities]: CSVCMsg_PacketEntities,
	[SVC_Messages.svc_ServerInfo]: CSVCMsg_ServerInfo,
	// [SVC_Messages.svc_FlattenedSerializer]: CSVCMsg_FlattenedSerializer, // TODO
	[SVC_Messages.svc_CreateStringTable]: CSVCMsg_CreateStringTable,
	[SVC_Messages.svc_UpdateStringTable]: CSVCMsg_UpdateStringTable,
	[SVC_Messages.svc_ClearAllStringTables]: CSVCMsg_ClearAllStringTables
} as const;

export const optionalSvcMessages = {
	[SVC_Messages.svc_VoiceData]: CSVCMsg_VoiceData,
	[SVC_Messages.svc_UserMessage]: CSVCMsg_UserMessage,
	[SVC_Messages.svc_UserCmds]: CSVCMsg_UserCommands
} as const;

type svcIdToName = IdToName<typeof SVC_Messages>;
type OptionalSvcIdToName = { [K in keyof typeof optionalSvcMessages]: svcIdToName[K] };

export const optionalSvcIds: OptionalSvcIdToName = Object.entries(SVC_Messages).reduce(
	(prev, curr) => (curr[1] in optionalSvcMessages ? { ...prev, [curr[1]]: curr[0] } : prev),
	{} as OptionalSvcIdToName
);

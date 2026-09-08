import { messageRegistry, type NetMessageName } from './generated/messageRegistry.js';

/**
 * Messages the parser decodes itself and surfaces through a dedicated event.
 *
 * Everything else in the registry is an on-demand event named after its protobuf
 * enum member — see {@link onDemandMessageNames}. These are excluded because they
 * already have a first-class surface, and because some of them (svc_PacketEntities
 * in particular) decode into buffers the parser recycles at the end of the packet,
 * so handing the raw message to a listener would hand out a dangling view.
 */
export const CORE_HANDLED = {
	svc_ServerInfo: 'serverinfo',
	svc_CreateStringTable: 'createstringtable',
	svc_UpdateStringTable: 'updatestringtable',
	svc_ClearAllStringTables: 'clearallstringtables',
	svc_PacketEntities: 'entitycreated / entityupdated / entitydeleted',
	GE_Source1LegacyGameEventList: 'gameeventlist',
	GE_Source1LegacyGameEvent: 'gameevent'
} as const satisfies Partial<Record<NetMessageName, string>>;

/** Message names that carry a dedicated event instead of an on-demand one. */
export type CoreHandledName = keyof typeof CORE_HANDLED;

export const CORE_HANDLED_IDS: ReadonlySet<number> = new Set(
	(Object.keys(CORE_HANDLED) as CoreHandledName[]).map(name => messageRegistry[name].id)
);

/** Every message that can be subscribed to by name. */
export type OnDemandMessageName = Exclude<NetMessageName, CoreHandledName>;

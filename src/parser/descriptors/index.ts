import { messageRegistry, type NetMessageName } from './generated/messageRegistry.js';
import { CORE_HANDLED_IDS, type OnDemandMessageName } from './svc.js';

export { messageRegistry, CORE_HANDLED_IDS };
export type { NetMessageName, OnDemandMessageName };
export type { NetMessagePayload, MessageRegistry } from './generated/messageRegistry.js';

export type MessageEntry = {
	id: number;
	name: NetMessageName;
	class: (typeof messageRegistry)[NetMessageName]['class'];
	/**
	 * True for messages the parser decodes itself and surfaces through a dedicated
	 * event (`serverinfo`, `createstringtable`, `gameevent`, …). These are handled
	 * by name in `parsePacket` and are not offered as on-demand events.
	 */
	core: boolean;
};

/**
 * Wire id → message, as a dense array. Ids top out in the low 400s, so this is a
 * few hundred slots and turns the per-message lookup in the packet loop into an
 * indexed read.
 */
const byId: (MessageEntry | undefined)[] = [];
for (const [name, def] of Object.entries(messageRegistry)) {
	byId[def.id] = {
		id: def.id,
		name: name as NetMessageName,
		class: def.class,
		core: CORE_HANDLED_IDS.has(def.id)
	};
}

export const messageById: readonly (MessageEntry | undefined)[] = byId;

/** Every message name in the registry, in declaration order. */
export const messageNames = Object.keys(messageRegistry) as NetMessageName[];

/** Message names that can be subscribed to as on-demand events. */
export const onDemandMessageNames = messageNames.filter(
	(name): name is OnDemandMessageName => !CORE_HANDLED_IDS.has(messageRegistry[name].id)
);

/** Look up a message by its wire id. */
export const messageForId = (id: number): MessageEntry | undefined => byId[id];

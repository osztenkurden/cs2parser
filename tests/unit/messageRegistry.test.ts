import { describe, test, expect } from 'bun:test';
import {
	messageRegistry,
	messageById,
	messageForId,
	messageNames,
	onDemandMessageNames,
	CORE_HANDLED_IDS
} from '../../src/parser/descriptors/index.js';
import { CORE_HANDLED } from '../../src/parser/descriptors/svc.js';
import { DemoReader } from '../../src/index.js';
import { SVC_Messages } from '../../src/ts-proto/netmessages.js';
import { NET_Messages } from '../../src/ts-proto/networkbasetypes.js';
import { EBaseUserMessages } from '../../src/ts-proto/usermessages.js';
import { ECstrike15UserMessages } from '../../src/ts-proto/cstrike15_usermessages.js';
import { ECsgoGameEvents } from '../../src/ts-proto/cs_gameevents.js';
import { ETEProtobufIds } from '../../src/ts-proto/te.js';

describe('message registry', () => {
	test('covers every message range CS2 uses', () => {
		// One representative from each enum the packet stream draws on. Before the
		// registry was generated only 14 ids existed across three of these.
		const spotChecks: [string, number][] = [
			['net_Tick', NET_Messages.net_Tick],
			['net_SetConVar', NET_Messages.net_SetConVar],
			['svc_VoiceInit', SVC_Messages.svc_VoiceInit],
			['svc_VoiceData', SVC_Messages.svc_VoiceData],
			['svc_UserCmds', SVC_Messages.svc_UserCmds],
			['svc_HLTVStatus', SVC_Messages.svc_HLTVStatus],
			['UM_SayText', EBaseUserMessages.UM_SayText],
			['UM_SayText2', EBaseUserMessages.UM_SayText2],
			['UM_TextMsg', EBaseUserMessages.UM_TextMsg],
			['CS_UM_ServerRankUpdate', ECstrike15UserMessages.CS_UM_ServerRankUpdate],
			['CS_UM_EndOfMatchAllPlayersData', ECstrike15UserMessages.CS_UM_EndOfMatchAllPlayersData],
			['CS_UM_WeaponSound', ECstrike15UserMessages.CS_UM_WeaponSound],
			['TE_EffectDispatchId', ETEProtobufIds.TE_EffectDispatchId],
			['TE_WorldDecalId', ETEProtobufIds.TE_WorldDecalId],
			['GE_FireBulletsId', ECsgoGameEvents.GE_FireBulletsId],
			['GE_PlayerBulletHitId', ECsgoGameEvents.GE_PlayerBulletHitId]
		];

		for (const [name, id] of spotChecks) {
			const entry = (messageRegistry as Record<string, { id: number } | undefined>)[name];
			expect(entry, `${name} missing from registry`).toBeDefined();
			expect(entry!.id).toBe(id);
			expect(messageForId(id)?.name).toBe(name as never);
		}
	});

	test('every entry has a unique id and a working decoder', () => {
		const seen = new Set<number>();
		for (const [name, def] of Object.entries(messageRegistry)) {
			expect(seen.has(def.id), `duplicate id ${def.id} for ${name}`).toBe(false);
			seen.add(def.id);
			expect(typeof def.class.decode).toBe('function');
			// Decoding an empty body must not throw — that's the shape parsePacket relies on.
			expect(() => def.class.decode(new Uint8Array(0))).not.toThrow();
		}
		expect(seen.size).toBeGreaterThan(200);
	});

	test('id lookup table agrees with the name-keyed registry', () => {
		for (const [name, def] of Object.entries(messageRegistry)) {
			const entry = messageById[def.id];
			expect(entry).toBeDefined();
			expect(entry!.name).toBe(name as never);
			expect(entry!.class).toBe(def.class);
		}
	});

	test('core-handled messages are excluded from the on-demand set', () => {
		expect(CORE_HANDLED_IDS.size).toBe(Object.keys(CORE_HANDLED).length);
		for (const id of CORE_HANDLED_IDS) {
			expect(messageForId(id)?.core).toBe(true);
		}
		expect(onDemandMessageNames).not.toContain('svc_PacketEntities' as never);
		expect(onDemandMessageNames).not.toContain('svc_ServerInfo' as never);
		expect(onDemandMessageNames).toContain('svc_UserCmds' as never);
		expect(messageNames.length).toBe(onDemandMessageNames.length + CORE_HANDLED_IDS.size);
	});

	test('no message name shadows a parser-owned event', () => {
		const reserved = [
			'progress',
			'end',
			'error',
			'tickstart',
			'tickend',
			'header',
			'gameevent',
			'gameeventlist',
			'serverinfo',
			'createstringtable',
			'updatestringtable',
			'clearallstringtables',
			'entitycreated',
			'entityupdated',
			'entitydeleted',
			'anymessage',
			'debug',
			'cancel',
			'entities',
			'stream'
		];
		for (const name of reserved) {
			expect(Object.prototype.hasOwnProperty.call(messageRegistry, name), `${name} is shadowed`).toBe(false);
		}
	});

	test('DemoReader exposes the registry for tooling', () => {
		expect(DemoReader.messageNames.length).toBe(onDemandMessageNames.length);
		expect(DemoReader.messageId('svc_VoiceData')).toBe(SVC_Messages.svc_VoiceData);
		expect(DemoReader.messageId('not_a_message')).toBeUndefined();
		expect(DemoReader.isMessageName('GE_FireBulletsId')).toBe(true);
		expect(DemoReader.isMessageName('player_death')).toBe(false);
		expect(DemoReader.isMessageName('svc_ServerInfo')).toBe(false);
		expect(DemoReader.isMessageName('svc_PacketEntities')).toBe(false);
		expect(DemoReader.messageId('svc_ServerInfo')).toBe(SVC_Messages.svc_ServerInfo);
		expect(['net_Tick', 'svc_ServerInfo', 'unknown'].filter(DemoReader.isMessageName)).toEqual(['net_Tick']);
	});

	test('discovered names can be passed directly to on()', () => {
		const reader = new DemoReader();
		// These also exercise the public types during typecheck.
		for (const name of DemoReader.messageNames) reader.on(name, () => {});
		const candidate: string = 'net_Tick';
		if (DemoReader.isMessageName(candidate)) reader.on(candidate, () => {});
		expect(reader.listenerCount('net_Tick')).toBe(2);
	});
});

describe('listener epoch', () => {
	test('bumps when listeners are added and removed', () => {
		const reader = new DemoReader();
		const before = reader._listenerEpoch;

		const handler = () => {};
		reader.on('svc_VoiceData', handler);
		expect(reader._listenerEpoch).toBeGreaterThan(before);

		const afterAdd = reader._listenerEpoch;
		reader.off('svc_VoiceData', handler);
		expect(reader._listenerEpoch).toBeGreaterThan(afterAdd);
	});
});

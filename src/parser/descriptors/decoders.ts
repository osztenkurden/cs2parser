import {
	CDemoClassInfo,
	CDemoConsoleCmd,
	CDemoCustomData,
	CDemoCustomDataCallbacks,
	CDemoFileHeader,
	CDemoFileInfo,
	CDemoFullPacket,
	CDemoPacket,
	CDemoSaveGame,
	CDemoSendTables,
	CDemoAnimationData,
	CDemoAnimationHeader,
	CDemoSpawnGroups,
	CDemoStringTables,
	CDemoSyncTick,
	CDemoUserCmd,
	EDemoCommands
} from '../../ts-proto/demo.js';

export const decoders = {
	[EDemoCommands.DEM_FileHeader]: {
		type: EDemoCommands.DEM_FileHeader,
		decode: CDemoFileHeader.decode
	},
	[EDemoCommands.DEM_FileInfo]: {
		name: 'DEM_FileInfo',
		type: EDemoCommands.DEM_FileInfo,
		decode: CDemoFileInfo.decode
	},
	[EDemoCommands.DEM_SyncTick]: {
		name: 'DEM_SyncTick',
		type: EDemoCommands.DEM_SyncTick,
		decode: CDemoSyncTick.decode
	},
	[EDemoCommands.DEM_SendTables]: {
		type: EDemoCommands.DEM_SendTables,
		decode: CDemoSendTables.decode
	},
	[EDemoCommands.DEM_ClassInfo]: {
		type: EDemoCommands.DEM_ClassInfo,
		decode: CDemoClassInfo.decode
	},
	[EDemoCommands.DEM_StringTables]: {
		name: 'DEM_StringTables',
		type: EDemoCommands.DEM_StringTables,
		decode: CDemoStringTables.decode
	},
	[EDemoCommands.DEM_Packet]: {
		type: EDemoCommands.DEM_Packet,
		decode: CDemoPacket.decode
	},
	[EDemoCommands.DEM_SignonPacket]: {
		type: EDemoCommands.DEM_SignonPacket,
		decode: CDemoPacket.decode
	},
	[EDemoCommands.DEM_ConsoleCmd]: {
		name: 'DEM_ConsoleCmd',
		type: EDemoCommands.DEM_ConsoleCmd,
		decode: CDemoConsoleCmd.decode
	},
	[EDemoCommands.DEM_CustomData]: {
		name: 'DEM_CustomData',
		type: EDemoCommands.DEM_CustomData,
		decode: CDemoCustomData.decode
	},
	[EDemoCommands.DEM_CustomDataCallbacks]: {
		name: 'DEM_CustomDataCallbacks',
		type: EDemoCommands.DEM_CustomDataCallbacks,
		decode: CDemoCustomDataCallbacks.decode
	},
	[EDemoCommands.DEM_UserCmd]: {
		name: 'DEM_UserCmd',
		type: EDemoCommands.DEM_UserCmd,
		decode: CDemoUserCmd.decode
	},
	[EDemoCommands.DEM_FullPacket]: {
		type: EDemoCommands.DEM_FullPacket,
		decode: CDemoFullPacket.decode
	},
	[EDemoCommands.DEM_SaveGame]: {
		name: 'DEM_SaveGame',
		type: EDemoCommands.DEM_SaveGame,
		decode: CDemoSaveGame.decode
	},
	[EDemoCommands.DEM_SpawnGroups]: {
		name: 'DEM_SpawnGroups',
		type: EDemoCommands.DEM_SpawnGroups,
		decode: CDemoSpawnGroups.decode
	},
	[EDemoCommands.DEM_AnimationData]: {
		name: 'DEM_AnimationData',
		type: EDemoCommands.DEM_AnimationData,
		decode: CDemoAnimationData.decode
	},
	[EDemoCommands.DEM_AnimationHeader]: {
		name: 'DEM_AnimationHeader',
		type: EDemoCommands.DEM_AnimationHeader,
		decode: CDemoAnimationHeader.decode
	}
} as const;

/** Subscribable frame names and payloads come from the decoder table. */
type OnDemandFrame = Extract<(typeof decoders)[keyof typeof decoders], { name: string }>;
export type DemoFrameEvents = {
	[D in OnDemandFrame as D['name']]: ReturnType<D['decode']>;
};

export type Decoders = typeof decoders;

export type DecoderKeys = keyof typeof decoders;

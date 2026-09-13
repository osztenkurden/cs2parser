import type { BaseDemoReader } from './base.js';
import type { ClassInfo } from './entities/classInfo.js';
import type { StringTableObject } from './stringtables.js';

/** Internal owned metadata at a FullPacket boundary. No player/entity snapshots. */
export interface DecoderCheckpoint {
	offset: number;
	previousTick: number;
	classInfo: ClassInfo;
	baselines: Uint8Array[];
	stringTables: (StringTableObject['table'] | null)[];
	reader: ReturnType<BaseDemoReader['_captureReplayState']>;
}
export class UnusableCheckpointError extends Error {}

/**
 * v2 Stage 4 result applier. Walks the binary op stream produced by
 * `EntityDecoderNative.feed_chunk` / `finish_stream` and emits the matching
 * JS-side events through the parse session's `enqueue` callback.
 *
 * Tag values mirror `crates/native/src/entity_parser.rs`.
 */
import type { DecodeResultJs } from 'cs2parser-native';
import { CDemoFileHeader } from '../../ts-proto/demo.js';
import { CMsgSource1LegacyGameEvent, CMsgSource1LegacyGameEventList } from '../../ts-proto/gameevents.js';
import { CSVCMsg_ServerInfo } from '../../ts-proto/netmessages.js';
import { CMsgPlayerInfo } from '../../ts-proto/networkbasetypes.js';
import { optionalSvcIds, optionalSvcMessages } from '../descriptors/svc.js';
import type { emit } from './types.js';

const TAG_CREATE = 1;
const TAG_DELETE = 3;
const TAG_TICKSTART = 10;
const TAG_TICKEND = 11;
const TAG_HEADER = 12;
const TAG_SERVERINFO = 13;
const TAG_GAMEEVENTLIST = 14;
const TAG_GAMEEVENT = 15;
const TAG_PLAYERINFO = 16;
const TAG_OPTIONAL_SVC = 22;
const TAG_DEM_STOP = 24;

export interface ApplyChunkContext {
	enqueue: emit;
	/** Sparse `(userid & 0xff) → CMsgPlayerInfo` map populated from `TAG_PLAYERINFO`. */
	playerInfoMap: (CMsgPlayerInfo | undefined)[];
	/** Optional check called between ops; when true, the dispatch loop bails out. */
	isCancelled?: () => boolean;
}

export function applyDecodeResult(result: DecodeResultJs, enqueue: emit): void {
	applyChunkResult(result, { enqueue, playerInfoMap: [] });
}

export function applyChunkResult(result: DecodeResultJs, ctx: ApplyChunkContext): void {
	const opsBuf = result.ops;
	const view = new DataView(opsBuf.buffer, opsBuf.byteOffset, opsBuf.byteLength);
	const blobs = result.blobs as Uint8Array[];
	const classNames = result.classNames;
	const len = opsBuf.length;
	const isCancelled = ctx.isCancelled;
	let off = 0;

	while (off < len) {
		if (isCancelled !== undefined && isCancelled()) return;
		const tag = view.getUint8(off);
		off += 1;

		switch (tag) {
			case TAG_CREATE: {
				const entityId = view.getUint32(off, true);
				off += 4;
				const classId = view.getUint32(off, true);
				off += 4;
				const entityType = view.getUint8(off);
				off += 1;
				const classNameIdx = view.getUint32(off, true);
				off += 4;
				ctx.enqueue('entitycreated', [entityId, classId, entityType as never, classNames[classNameIdx]!]);
				break;
			}
			case TAG_DELETE: {
				const entityId = view.getUint32(off, true);
				off += 4;
				ctx.enqueue('entitydeleted', entityId);
				break;
			}
			case TAG_TICKSTART: {
				const tick = view.getInt32(off, true);
				off += 4;
				ctx.enqueue('tickstart', tick);
				break;
			}
			case TAG_TICKEND: {
				const tick = view.getInt32(off, true);
				off += 4;
				ctx.enqueue('tickend', tick);
				break;
			}
			case TAG_HEADER: {
				const blobIdx = view.getUint32(off, true);
				off += 4;
				ctx.enqueue('header', CDemoFileHeader.decode(blobs[blobIdx]!));
				break;
			}
			case TAG_SERVERINFO: {
				const blobIdx = view.getUint32(off, true);
				off += 4;
				ctx.enqueue('serverinfo', CSVCMsg_ServerInfo.decode(blobs[blobIdx]!));
				break;
			}
			case TAG_GAMEEVENTLIST: {
				const blobIdx = view.getUint32(off, true);
				off += 4;
				ctx.enqueue('gameeventlist', CMsgSource1LegacyGameEventList.decode(blobs[blobIdx]!));
				break;
			}
			case TAG_GAMEEVENT: {
				const blobIdx = view.getUint32(off, true);
				off += 4;
				ctx.enqueue('gameevent', CMsgSource1LegacyGameEvent.decode(blobs[blobIdx]!));
				break;
			}
			case TAG_PLAYERINFO: {
				const blobIdx = view.getUint32(off, true);
				off += 4;
				const player = CMsgPlayerInfo.decode(blobs[blobIdx]!);
				if (player.userid !== undefined) {
					ctx.playerInfoMap[player.userid & 0xff] = player;
				}
				break;
			}
			case TAG_OPTIONAL_SVC: {
				const cmdId = view.getUint32(off, true);
				off += 4;
				const blobIdx = view.getUint32(off, true);
				off += 4;
				const decoder = (optionalSvcMessages as Record<number, { decode: (b: Uint8Array) => unknown }>)[cmdId];
				const name = (optionalSvcIds as Record<number, string>)[cmdId];
				if (decoder && name) {
					ctx.enqueue(name as never, decoder.decode(blobs[blobIdx]!) as never);
				}
				break;
			}
			case TAG_DEM_STOP: {
				ctx.enqueue('end', { incomplete: false });
				break;
			}
			default:
				throw new Error(`unknown op tag ${tag}`);
		}
	}
}

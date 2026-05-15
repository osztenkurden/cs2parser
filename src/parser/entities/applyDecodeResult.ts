/**
 * v2 applier: handles only `entitycreated` / `entitydeleted` lifecycle events
 * out of the Rust decoder's op stream. Property values live entirely in
 * Rust-resident state and are read by JS on demand via `parser.getNumberProp`
 * / `getStringProp` / etc., so the per-property record walk that the v1
 * applier did is gone.
 */
import type { emit } from './types.js';
import type { DecodeResultJs } from 'cs2parser-native';

type DecodeResult = DecodeResultJs;

const TAG_CREATE = 1;
const TAG_DELETE = 3;

export function applyDecodeResult(result: DecodeResult, enqueue: emit): void {
	const opsBuf = result.ops;
	const view = new DataView(opsBuf.buffer, opsBuf.byteOffset, opsBuf.byteLength);
	const classNames = result.classNames;

	let off = 0;
	const len = opsBuf.length;

	while (off < len) {
		const tag = view.getUint8(off);
		off += 1;
		if (tag === TAG_DELETE) {
			const entityId = view.getUint32(off, true);
			off += 4;
			enqueue('entitydeleted', entityId);
			continue;
		}
		if (tag === TAG_CREATE) {
			const entityId = view.getUint32(off, true);
			off += 4;
			const classId = view.getUint32(off, true);
			off += 4;
			const entityType = view.getUint8(off);
			off += 1;
			const classNameIdx = view.getUint32(off, true);
			off += 4;
			const className = classNames[classNameIdx]!;
			enqueue('entitycreated', [entityId, classId, entityType as never, className]);
			continue;
		}
		throw new Error(`unknown op tag ${tag}`);
	}
}

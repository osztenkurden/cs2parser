import { BinaryReader } from '@bufbuild/protobuf/wire';

// BinaryReader has no public reset API. These are ordinary runtime properties,
// but buf/view are private and len is readonly in protobuf's declarations.
// Keep the version-dependent reset isolated here; binary-reader tests compare
// reused readers with fresh upstream readers, including bounded slices/errors.
type ReaderState = {
	buf: Uint8Array;
	len: number;
	pos: number;
	view: DataView;
};

export class BinaryReaderEditable extends BinaryReader {
	setTo(buf: Uint8Array) {
		const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
		const state = this as unknown as ReaderState;
		state.buf = buf;
		state.len = buf.length;
		state.pos = 0;
		state.view = view;
	}
}

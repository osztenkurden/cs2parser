import { BitBuffer } from '../parser/ubitreader.js';
import { IceKey } from './ice.js';

/** Public GOTV messages use ICE level 2 with a 16-byte match-specific key. */
export class EncryptedMessageDecoder {
	private readonly cipher = new IceKey(2);

	constructor(key: Uint8Array) {
		if (!(key instanceof Uint8Array) || key.length !== 16) {
			throw new TypeError('decryptionKey must contain exactly 16 bytes');
		}
		this.cipher.set(key);
	}

	decode(encrypted: Uint8Array): { id: number; bytes: Uint8Array } {
		if (encrypted.length === 0 || encrypted.length % 8 !== 0) {
			throw new Error('Invalid encrypted message block length');
		}
		const plain = new Uint8Array(encrypted.length);
		this.cipher.decryptUint8Array(encrypted, plain);
		// One padding-count byte, random padding, then a big-endian payload length.
		const offset = 1 + plain[0]!;
		if (offset + 4 >= plain.length) throw new Error('Invalid encrypted message padding');
		const size = new DataView(plain.buffer).getUint32(offset, false);
		if (size !== plain.length - offset - 4) throw new Error('Invalid encrypted message payload length');

		// Unlike CS:GO, CS2 uses a bit-packed UBitVar ID here, just like a normal packet.
		const reader = new BitBuffer(plain.subarray(offset + 4));
		const id = reader.readUbitVar();
		const length = reader.ReadUVarInt32();
		const trailingBits = reader.RemainingBits - length * 8;
		if (trailingBits < 0 || trailingBits > 7) throw new Error('Invalid encrypted inner message length');
		const bytes = new Uint8Array(length);
		reader.readBytes(bytes);
		// Unused bits in the final byte can be nonzero in real demos.
		return { id, bytes };
	}
}

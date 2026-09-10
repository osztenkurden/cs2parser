import { CDataGCCStrike15_v2_MatchInfo } from '../ts-proto/cstrike15_gcmessages.js';

/** Convert a GC uint64 key (bigint or decimal/0x-prefixed string) to Valve's 16 ASCII hex bytes. */
export function decodeEncryptionKey(value: bigint | string): Uint8Array {
	if (typeof value !== 'bigint' && (typeof value !== 'string' || !/^(?:[0-9]+|0x[0-9a-f]+)$/i.test(value))) {
		throw new TypeError('Encryption key must be a uint64 bigint or decimal/0x-prefixed string');
	}
	const key = BigInt(value);
	if (key <= 0n || key > 0xffffffffffffffffn) throw new RangeError('Encryption key must be a nonzero uint64');
	return new TextEncoder().encode(key.toString(16).padStart(16, '0').toUpperCase());
}

/** Extract the public chat key from the byte contents of a matching .dem.info file. */
export function extractPublicEncryptionKey(info: Uint8Array): Uint8Array {
	const match = CDataGCCStrike15_v2_MatchInfo.decode(info);
	const key = match.watchablematchinfo?.cl_decryptdata_key_pub;
	if (key === undefined || key === '0') throw new Error('Match info contains no public demo decryption key');
	return decodeEncryptionKey(key);
}

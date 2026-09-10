import { describe, expect, spyOn, test } from 'bun:test';
import { BinaryWriter } from '@bufbuild/protobuf/wire';
import { DemoReader, decodeEncryptionKey, extractPublicEncryptionKey, type ParseOptions } from '../../src/index.js';
import { DemoReader as BrowserDemoReader } from '../../src/browser.js';
import { EncryptedMessageDecoder } from '../../src/encryption/encryptedMessage.js';
import { IceKey } from '../../src/encryption/ice.js';
import { CSVCMsg_EncryptedData, SVC_Messages } from '../../src/ts-proto/netmessages.js';
import { EBaseUserMessages } from '../../src/ts-proto/usermessages.js';
import { EDemoCommands } from '../../src/ts-proto/demo.js';
import { bytesField, demoFile, demoFrame, networkPacket } from '../helpers/demo.js';
import { ParseSession } from '../../src/parser/entities/parseSession.js';
import { EntityMode } from '../../src/index.js';
import { buildFragment } from './broadcast/helpers.js';
import { encryptedChatCiphertext } from '../helpers/encryptedChat.js';

const key = decodeEncryptionKey('0x0123456789ABCDEF');
const sayText = (text: string) => new BinaryWriter().uint32(8).uint32(1).uint32(18).string(text).finish();
const sayText2 = (text: string) =>
	new BinaryWriter()
		.uint32(8)
		.uint32(1)
		.uint32(16)
		.bool(true)
		.uint32(26)
		.string('Cstrike_Chat_All')
		.uint32(34)
		.string('Test player')
		.uint32(42)
		.string(text)
		.uint32(64)
		.bool(true)
		.finish();

function encryptPlain(plain: Uint8Array) {
	const cipher = new IceKey(2);
	cipher.set(key);
	const encrypted = new Uint8Array(plain.length);
	for (let i = 0; i < plain.length; i += 8) cipher.encrypt(plain.subarray(i, i + 8), encrypted.subarray(i, i + 8));
	return encrypted;
}

function envelope(payload: Uint8Array, extraPadding = 0) {
	const padding = ((8 - ((payload.length + 5) % 8)) % 8) + extraPadding;
	const plain = new Uint8Array(5 + padding + payload.length);
	plain[0] = padding;
	new DataView(plain.buffer).setUint32(1 + padding, payload.length, false);
	plain.set(payload, 5 + padding);
	return encryptPlain(plain);
}

const encryptedBody = (payload: Uint8Array, keyType = 2) =>
	new BinaryWriter().uint32(10).bytes(payload).uint32(16).int32(keyType).finish();
const chatCipher = (text = 'Hello, world!') =>
	envelope(networkPacket([{ id: EBaseUserMessages.UM_SayText2, body: sayText2(text) }]));
const wrap = (body: Uint8Array, tick = 1) =>
	demoFrame(
		EDemoCommands.DEM_Packet,
		bytesField(3, networkPacket([{ id: SVC_Messages.svc_EncryptedData, body }])),
		tick
	);
const demo = (...bodies: Uint8Array[]) =>
	demoFile(...bodies.map((body, i) => wrap(body, i + 1)), demoFrame(EDemoCommands.DEM_Stop));

describe('demo public encryption keys', () => {
	test('converts uint64 to uppercase, zero-padded ASCII, without losing precision', () => {
		expect(new TextDecoder().decode(key)).toBe('0123456789ABCDEF');
		expect(decodeEncryptionKey('81985529216486895')).toEqual(key);
		expect(new TextDecoder().decode(decodeEncryptionKey(1n))).toBe('0000000000000001');
		expect(new TextDecoder().decode(decodeEncryptionKey('18446744073709551615'))).toBe('FFFFFFFFFFFFFFFF');
	});
	test.each(['0', '-1', '18446744073709551616', '', 'junk', '1.5'])('rejects invalid uint64 %s', value => {
		expect(() => decodeEncryptionKey(value)).toThrow();
	});
	test('extracts the key from protobuf .dem.info bytes', () => {
		const watch = new BinaryWriter().uint32(56).uint64('81985529216486895').finish();
		expect(extractPublicEncryptionKey(bytesField(3, watch))).toEqual(key);
		expect(() => extractPublicEncryptionKey(new Uint8Array())).toThrow('no public');
		expect(() => extractPublicEncryptionKey(bytesField(3, Uint8Array.of(56, 0)))).toThrow('no public');
		expect(() => extractPublicEncryptionKey(Uint8Array.of(26, 99))).toThrow();
	});
});

describe('CS2 encrypted message envelope', () => {
	test('matches the frozen synthetic ICE vector', () => {
		expect(chatCipher()).toEqual(encryptedChatCiphertext);
		expect(new EncryptedMessageDecoder(key).decode(encryptedChatCiphertext)).toEqual({
			id: 118,
			bytes: sayText2('Hello, world!')
		});
	});
	test.each([0, 8, 64, 128])('reads bit-packed messages with %i extra padding bytes', padding => {
		const bytes = sayText2('Hello');
		const packet = networkPacket([{ id: EBaseUserMessages.UM_SayText2, body: bytes }]);
		packet[packet.length - 1]! |= 0xfc; // Engine padding bits need not be zero.
		expect(new EncryptedMessageDecoder(key).decode(envelope(packet, padding))).toEqual({ id: 118, bytes });
	});
	test('rejects wrong keys and malformed block, padding, and payload lengths', () => {
		expect(() => new EncryptedMessageDecoder(key.subarray(0, 8))).toThrow();
		const decoder = new EncryptedMessageDecoder(key);
		for (const bytes of [
			new Uint8Array(0),
			new Uint8Array(9),
			encryptPlain(new Uint8Array(8).fill(255)),
			encryptPlain(new Uint8Array(8))
		]) {
			expect(() => decoder.decode(bytes)).toThrow();
		}
		expect(() => new EncryptedMessageDecoder(decodeEncryptionKey(1n)).decode(chatCipher())).toThrow();
	});
	test('rejects truncated inner messages and extra bytes', () => {
		const packet = networkPacket([{ id: 118, body: sayText2('Hello') }]);
		expect(() =>
			new EncryptedMessageDecoder(key).decode(envelope(packet.subarray(0, packet.length - 1)))
		).toThrow();
		expect(() => new EncryptedMessageDecoder(key).decode(envelope(Uint8Array.from([...packet, 0])))).toThrow();
	});
});

describe('encrypted chat event dispatch', () => {
	test.each([DemoReader, BrowserDemoReader])('decrypts through server and browser readers', async Reader => {
		const reader = new Reader();
		const texts: string[] = [];
		const named: string[] = [];
		const raw: { id: number; bytes: Uint8Array }[] = [];
		reader.on('chat', m => texts.push(m.text));
		reader.on('UM_SayText2', m => named.push(m.param2!));
		reader.on('anymessage', m => raw.push(m));
		const result = await reader.parseDemo(
			demo(encryptedBody(chatCipher('First')), encryptedBody(chatCipher('Second'))),
			{ decryptionKey: key }
		);
		expect(result).toEqual({ incomplete: false });
		expect(texts).toEqual(['First', 'Second']);
		expect(named).toEqual(texts);
		expect(raw.map(m => m.id)).toEqual([78, 118, 78, 118]);
		expect(raw[1]!.bytes).toEqual(sayText2('First'));
	});
	test('supports encrypted SayText, named listeners alone, and unknown raw inner messages', async () => {
		const reader = new DemoReader();
		const texts: string[] = [];
		const ids: number[] = [];
		reader.on('UM_SayText', m => texts.push(m.text!));
		reader.on('anymessage', m => ids.push(m.id));
		const packets = [
			{ id: 117, body: sayText('Hello') },
			{ id: 999, body: Uint8Array.of(1, 2, 3) }
		];
		await reader.parseDemo(demo(...packets.map(p => encryptedBody(envelope(networkPacket([p]))))), {
			decryptionKey: key
		});
		expect(texts).toEqual(['Hello']);
		expect(ids).toEqual([78, 117, 78, 999]);
	});
	test.each([{}, { decryptionKey: key, svc_EncryptedData: false }, { decryptionKey: key, UM_SayText2: false }])(
		'respects missing keys and explicit decode overrides %j',
		async (opts: ParseOptions) => {
			const reader = new DemoReader();
			let count = 0;
			reader.on('chat', () => count++);
			const result = await reader.parseDemo(demo(encryptedBody(chatCipher())), opts);
			expect(result).toEqual({ incomplete: false });
			expect(count).toBe(0);
		}
	);
	test('private envelopes, malformed ciphertext, and corrupt protobuf do not abort gameplay', async () => {
		const reader = new DemoReader();
		const texts: string[] = [];
		const debug: string[] = [];
		reader.on('chat', m => texts.push(m.text));
		reader.on('debug', m => debug.push(m));
		const corrupt = encryptedBody(new Uint8Array(9));
		const malformed = encryptedBody(envelope(networkPacket([{ id: 118, body: Uint8Array.of(42, 255) }])));
		const result = await reader.parseDemo(
			demo(encryptedBody(chatCipher('Private'), 1), corrupt, corrupt, malformed, encryptedBody(chatCipher('OK'))),
			{ decryptionKey: key }
		);
		expect(result).toEqual({ incomplete: false });
		expect(texts).toEqual(['OK']);
		expect(debug.filter(m => m.includes('Unable to decrypt'))).toHaveLength(2);
	});
	test('does not decode envelopes without consumers and follows subscription changes in broadcasts', () => {
		const reader = new DemoReader();
		const mutableKey = Uint8Array.from(key);
		const session = ParseSession.forBroadcast(
			EntityMode.NONE,
			queue => {
				for (const [event, data] of queue) reader.emit(event, data as never);
				queue.length = 0;
			},
			reader,
			{ decryptionKey: mutableKey }
		);
		mutableKey.fill(0); // Session owns its key snapshot.
		let tick = 0;
		const send = () =>
			session.pushBroadcastFragment(
				buildFragment([
					{
						cmd: EDemoCommands.DEM_Packet,
						tick: ++tick,
						payload: networkPacket([{ id: 78, body: encryptedBody(chatCipher()) }])
					}
				]),
				0
			);
		const decode = spyOn(CSVCMsg_EncryptedData, 'decode');
		let count = 0;
		const listener = () => count++;
		try {
			send();
			expect(decode).not.toHaveBeenCalled();
			reader.on('chat', listener);
			send();
			expect(count).toBe(1);
			reader.off('chat', listener);
			send();
			expect(decode).toHaveBeenCalledTimes(1);
		} finally {
			decode.mockRestore();
		}
	});
});

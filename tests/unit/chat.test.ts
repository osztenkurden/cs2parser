import { expect, test } from 'bun:test';
import { BinaryWriter } from '@bufbuild/protobuf/wire';
import { DemoReader } from '../../src/index.js';
import type { ChatMessage } from '../../src/parser/entities/types.js';
import { bytesField, demoFile, demoFrame, networkPacket } from '../helpers/demo.js';

test.each([117, 118])('chat from message %i includes userinfo without entities', async id => {
	const reader = new DemoReader();
	const info = { userid: 256, name: 'Test player', steamid: '76561198000000000' };
	reader.players[0] = info;
	const messages: ChatMessage[] = [];
	reader.on('chat', message => messages.push(message));
	const packets = [1, 0, -1, 2].map(index => {
		const body = new BinaryWriter()
			.uint32(8)
			.int32(index)
			.uint32(id === 117 ? 18 : 42)
			.string('Hello')
			.finish();
		return demoFrame(7, bytesField(3, networkPacket([{ id, body }])));
	});
	expect(await reader.parseDemo(demoFile(...packets, demoFrame(0)))).toEqual({ status: 'complete' });
	expect(messages).toHaveLength(4);
	expect(messages[0]!.playerInfo).toBe(info);
	expect(messages.every(message => message.player === null && message.text === 'Hello')).toBe(true);
	expect(messages.slice(1).map(message => message.playerInfo)).toEqual([null, null, null]);
});

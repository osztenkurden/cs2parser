import { describe, expect, spyOn, test } from 'bun:test';
import { DemoReader, EntityMode } from '../../src/index.js';
import { ParseSession, type ParseSettings } from '../../src/parser/entities/parseSession.js';
import type { UserCommand } from '../../src/parser/entities/types.js';
import { CNETMsg_Tick, NET_Messages } from '../../src/ts-proto/networkbasetypes.js';
import { SVC_Messages } from '../../src/ts-proto/netmessages.js';
import { EDemoCommands } from '../../src/ts-proto/demo.js';
import { buildFragment } from './broadcast/helpers.js';
import { bytesField, networkPacket } from '../helpers/demo.js';

const makeSession = (settings?: ParseSettings) => {
	const reader = new DemoReader();
	const session = ParseSession.forBroadcast(
		EntityMode.NONE,
		queue => {
			for (const [name, data] of queue) reader.emit(name, data as never);
			queue.length = 0;
		},
		reader,
		settings
	);
	let tick = 0;
	const send = (id: number, body: Uint8Array) =>
		session.pushBroadcastFragment(
			buildFragment([{ cmd: EDemoCommands.DEM_Packet, tick: ++tick, payload: networkPacket([{ id, body }]) }]),
			0
		);
	return { reader, send };
};

describe('message subscription decoding', () => {
	test.each([undefined, true, false])('decode calls follow an explicit override of %s', flag => {
		const decode = spyOn(CNETMsg_Tick, 'decode');
		try {
			const { reader, send } = makeSession({ net_Tick: flag });
			const seen: number[] = [];
			const listener = (message: CNETMsg_Tick) => seen.push(message.tick!);
			send(NET_Messages.net_Tick, Uint8Array.of(8, 1));
			expect(decode).toHaveBeenCalledTimes(flag === true ? 1 : 0);
			reader.on('net_Tick', listener);
			send(NET_Messages.net_Tick, Uint8Array.of(8, 2));
			expect(decode).toHaveBeenCalledTimes(flag === true ? 2 : flag === false ? 0 : 1);
			reader.off('net_Tick', listener);
			send(NET_Messages.net_Tick, Uint8Array.of(8, 3));
			expect(decode).toHaveBeenCalledTimes(flag === true ? 3 : flag === false ? 0 : 1);
			expect(seen).toEqual(flag === false ? [] : [2]);
		} finally {
			decode.mockRestore();
		}
	});

	test('raw subscription receives unknown IDs', () => {
		const { reader, send } = makeSession();
		const ids: number[] = [];
		reader.on('anymessage', message => ids.push(message.id));
		send(999, Uint8Array.of(1, 2, 3));
		expect(ids).toEqual([999]);
	});
});

describe('user-command baseline recovery', () => {
	const full = Uint8Array.of(0x0a, 0x05, 0x2d, 0, 0, 0x80, 0x3f); // forwardmove = 1
	const delta = Uint8Array.of(0x0a, 0x02, 0x10, 1); // client_tick = 1
	const setup = () => {
		const { reader, send } = makeSession();
		const commands: UserCommand[] = [];
		const listener = (command: UserCommand) => commands.push(command);
		reader.on('usercommand', listener);
		const command = (payload: Uint8Array, isDelta = false) =>
			send(
				SVC_Messages.svc_UserCmds,
				bytesField(1, Uint8Array.from([24, 0, ...bytesField(isDelta ? 6 : 1, payload)]))
			);
		return { reader, commands, listener, command };
	};

	test.each([false, true])('a malformed command invalidates its chain (delta: %s)', isDelta => {
		const { command, commands } = setup();
		command(full);
		command(isDelta ? Uint8Array.of(0xff, 7) : Uint8Array.of(0x0a, 10), isDelta);
		command(delta, true);
		command(full);
		command(delta, true);
		expect(commands.map(c => c.cmd?.base?.forwardmove ?? null)).toEqual([1, null, null, 1, 1]);
	});

	test('a subscription gap invalidates the old baseline until another full command', () => {
		const { reader, commands, command, listener } = setup();
		command(full);
		reader.off('usercommand', listener);
		command(delta, true);
		reader.on('usercommand', listener);
		command(delta, true);
		command(full);
		command(delta, true);
		expect(commands.map(c => c.cmd?.base?.forwardmove ?? null)).toEqual([1, null, 1, 1]);
	});

	test('an empty delta is still a delta and inherits its baseline', () => {
		const { command, commands } = setup();
		command(full);
		command(new Uint8Array(0), true);
		expect(commands[1]?.isDelta).toBe(true);
		expect(commands[1]?.cmd?.base?.forwardmove).toBe(1);
	});
});

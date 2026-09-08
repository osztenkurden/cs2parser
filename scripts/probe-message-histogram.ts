/**
 * Probe: histogram every top-level message id inside DEM_Packet / DEM_SignonPacket /
 * DEM_FullPacket, plus a frame-command histogram. Shows which parts of the wire
 * stream the parser currently decodes, opts into, or drops on the floor.
 *
 *   bun scripts/probe-message-histogram.ts <demo.dem>
 */
import { demoFrames } from './demo-frames.js';
import { CDemoFullPacket, CDemoPacket, EDemoCommands } from '../src/ts-proto/demo.js';
import { SVC_Messages } from '../src/ts-proto/netmessages.js';
import { NET_Messages } from '../src/ts-proto/networkbasetypes.js';
import { EBaseUserMessages, EBaseEntityMessages } from '../src/ts-proto/usermessages.js';
import { ECstrike15UserMessages } from '../src/ts-proto/cstrike15_usermessages.js';
import { EBaseGameEvents } from '../src/ts-proto/gameevents.js';
import { ECsgoGameEvents } from '../src/ts-proto/cs_gameevents.js';
import { CSVCMsg_UserMessage } from '../src/ts-proto/netmessages.js';
import { BitBuffer } from '../src/parser/ubitreader.js';
import { messageForId } from '../src/parser/descriptors/index.js';

const idToName = new Map<number, string>();
const addEnum = (e: Record<string, unknown>) => {
	for (const [k, v] of Object.entries(e)) if (typeof v === 'number' && v >= 0 && !idToName.has(v)) idToName.set(v, k);
};
addEnum(NET_Messages);
addEnum(SVC_Messages);
addEnum(EBaseUserMessages);
addEnum(EBaseEntityMessages);
addEnum(EBaseGameEvents);
addEnum(ECstrike15UserMessages);
addEnum(ECsgoGameEvents);

const path = process.argv[2];
if (!path) throw new Error('Usage: bun scripts/probe-message-histogram.ts <demo.dem>');
const msgCounts = new Map<number, number>();
const msgBytes = new Map<number, number>();
const frameCounts = new Map<number, number>();
const wrappedUm = new Map<number, number>();

const scanPacket = (data: Uint8Array) => {
	const r = new BitBuffer(data);
	while (r.RemainingBits > 8) {
		const cmd = r.readUbitVar();
		const size = r.ReadUVarInt32();
		msgCounts.set(cmd, (msgCounts.get(cmd) ?? 0) + 1);
		msgBytes.set(cmd, (msgBytes.get(cmd) ?? 0) + size);
		if (cmd === SVC_Messages.svc_UserMessage) {
			const b = new Uint8Array(size);
			r.readBytes(b);
			const inner = CSVCMsg_UserMessage.decode(b);
			const t = inner.msg_type ?? -1;
			wrappedUm.set(t, (wrappedUm.get(t) ?? 0) + 1);
		} else {
			r.skipBytesBetter(size);
		}
	}
};

for (const { type, bytes } of demoFrames(path)) {
	frameCounts.set(type, (frameCounts.get(type) ?? 0) + 1);
	try {
		if (type === EDemoCommands.DEM_Packet || type === EDemoCommands.DEM_SignonPacket) {
			const p = CDemoPacket.decode(bytes());
			if (p.data) scanPacket(p.data);
		} else if (type === EDemoCommands.DEM_FullPacket) {
			const p = CDemoFullPacket.decode(bytes());
			if (p.packet?.data) scanPacket(p.packet.data);
		}
	} catch (e) {
		console.error('frame decode failed', type, e);
		process.exitCode = 1;
	}
}

const demoCmdName = Object.fromEntries(Object.entries(EDemoCommands).map(([k, v]) => [v, k]));
console.log('\n=== demo frame commands ===');
for (const [id, n] of [...frameCounts].sort((a, b) => b[1] - a[1])) {
	console.log(`${String(id).padStart(3)} ${(demoCmdName[id] ?? '?').padEnd(28)} ${String(n).padStart(8)}`);
}

console.log('\n=== packet messages (status: core | on-demand | UNKNOWN) ===');
const rows = [...msgCounts].sort((a, b) => msgBytes.get(b[0])! - msgBytes.get(a[0])!);
for (const [id, n] of rows) {
	const entry = messageForId(id);
	const status = !entry ? 'UNKNOWN' : entry.core ? 'core' : 'on-demand';
	console.log(
		`${String(id).padStart(4)} ${(entry?.name ?? idToName.get(id) ?? '???').padEnd(38)} ${status.padEnd(10)} n=${String(n).padStart(8)}  bytes=${msgBytes.get(id)}`
	);
}

if (wrappedUm.size) {
	console.log('\n=== inner msg_type inside svc_UserMessage envelopes ===');
	for (const [id, n] of [...wrappedUm].sort((a, b) => b[1] - a[1])) {
		console.log(`${String(id).padStart(4)} ${(idToName.get(id) ?? '???').padEnd(38)} n=${n}`);
	}
}

const tally = { core: [0, 0], 'on-demand': [0, 0], UNKNOWN: [0, 0] } as Record<string, [number, number]>;
for (const [id, n] of msgCounts) {
	const entry = messageForId(id);
	const status = !entry ? 'UNKNOWN' : entry.core ? 'core' : 'on-demand';
	tally[status]![0] += 1;
	tally[status]![1] += msgBytes.get(id)!;
}
const totalBytes = [...msgBytes.values()].reduce((a, b) => a + b, 0);
console.log('\n=== coverage ===');
for (const [status, [types, bytes]] of Object.entries(tally)) {
	console.log(
		`${status.padEnd(8)} types=${String(types).padStart(3)}  bytes=${String(bytes).padStart(10)}  ${((bytes / totalBytes) * 100).toFixed(1)}%`
	);
}
console.log(`total    types=${String(msgCounts.size).padStart(3)}  bytes=${String(totalBytes).padStart(10)}`);

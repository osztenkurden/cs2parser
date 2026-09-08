/**
 * Generates `src/parser/descriptors/generated/messageRegistry.ts` — the complete
 * id → protobuf-class table for every message that can appear at the top level of
 * a DEM_Packet.
 *
 * Hand-curating this table is how message types go missing: the parser only ever
 * sees what someone remembered to add. Deriving it from the protobuf enums means a
 * protocol bump surfaces new ids the next time this runs, and anything the naming
 * rules can't resolve is reported instead of silently skipped.
 *
 *   bun scripts/generate-message-registry.ts [--check]
 *
 * `--check` verifies the committed file is up to date without writing (for CI).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import * as netmessages from '../src/ts-proto/netmessages.js';
import * as networkbasetypes from '../src/ts-proto/networkbasetypes.js';
import * as usermessages from '../src/ts-proto/usermessages.js';
import * as cstrike15 from '../src/ts-proto/cstrike15_usermessages.js';
import * as gameevents from '../src/ts-proto/gameevents.js';
import * as csgameevents from '../src/ts-proto/cs_gameevents.js';
import * as te from '../src/ts-proto/te.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_FILE = path.join(ROOT, 'src', 'parser', 'descriptors', 'generated', 'messageRegistry.ts');

/** Proto modules to resolve message classes from, in import-specifier order. */
const MODULES: { specifier: string; ns: Record<string, unknown> }[] = [
	{ specifier: '../../../ts-proto/networkbasetypes.js', ns: networkbasetypes },
	{ specifier: '../../../ts-proto/netmessages.js', ns: netmessages },
	{ specifier: '../../../ts-proto/usermessages.js', ns: usermessages },
	{ specifier: '../../../ts-proto/gameevents.js', ns: gameevents },
	{ specifier: '../../../ts-proto/cstrike15_usermessages.js', ns: cstrike15 },
	{ specifier: '../../../ts-proto/te.js', ns: te },
	{ specifier: '../../../ts-proto/cs_gameevents.js', ns: csgameevents }
];

type EnumGroup = {
	/** Enum object holding member name → wire id. */
	values: Record<string, unknown>;
	/** Where the enum itself is imported from, for the emitted `[Enum.member]` keys. */
	specifier: string;
	enumName: string;
	/** Human label for the section comment in the generated file. */
	label: string;
	/** Candidate protobuf class names for a member, tried in order. */
	candidates: (member: string) => string[];
};

const GROUPS: EnumGroup[] = [
	{
		values: networkbasetypes.NET_Messages,
		specifier: '../../../ts-proto/networkbasetypes.js',
		enumName: 'NET_Messages',
		label: 'NET_Messages — transport layer (0–15)',
		candidates: m => [`CNETMsg_${m.slice(4)}`]
	},
	{
		values: netmessages.SVC_Messages,
		specifier: '../../../ts-proto/netmessages.js',
		enumName: 'SVC_Messages',
		label: 'SVC_Messages — server → client (40–77)',
		candidates: m => [`CSVCMsg_${m.slice(4)}`]
	},
	{
		values: usermessages.EBaseUserMessages,
		specifier: '../../../ts-proto/usermessages.js',
		enumName: 'EBaseUserMessages',
		label: 'EBaseUserMessages — engine user messages (101–166)',
		candidates: m => {
			const b = m.slice(3);
			return [`CUserMessage${b}`, `CUserMsg_${b}`, `CUserMessage_${b}`, `CUserMsg${b}`];
		}
	},
	{
		values: usermessages.EBaseEntityMessages,
		specifier: '../../../ts-proto/usermessages.js',
		enumName: 'EBaseEntityMessages',
		label: 'EBaseEntityMessages — per-entity messages',
		candidates: m => {
			const b = m.slice(3);
			return [`CEntityMessage${b}`, `CEntityMessage_${b}`];
		}
	},
	{
		values: gameevents.EBaseGameEvents,
		specifier: '../../../ts-proto/gameevents.js',
		enumName: 'EBaseGameEvents',
		label: 'EBaseGameEvents — engine game events (200–214)',
		candidates: m => {
			const raw = m.slice(3);
			const b = raw.replace(/Event$/, '');
			return [`CMsg${b}Event`, `CMsg${b}`, `CMsg${raw}`];
		}
	},
	{
		values: cstrike15.ECstrike15UserMessages,
		specifier: '../../../ts-proto/cstrike15_usermessages.js',
		enumName: 'ECstrike15UserMessages',
		label: 'ECstrike15UserMessages — CS-specific user messages (301–389)',
		candidates: m => {
			const b = m.slice(6);
			return [`CCSUsrMsg_${b}`, `CCSUsrMsg${b}`];
		}
	},
	{
		values: te.ETEProtobufIds,
		specifier: '../../../ts-proto/te.js',
		enumName: 'ETEProtobufIds',
		label: 'ETEProtobufIds — temp entities (400–426)',
		candidates: m => {
			const b = m.slice(3).replace(/Id$/, '');
			return [`CMsgTE${b}`, `CMsgTE_${b}`];
		}
	},
	{
		values: csgameevents.ECsgoGameEvents,
		specifier: '../../../ts-proto/cs_gameevents.js',
		enumName: 'ECsgoGameEvents',
		label: 'ECsgoGameEvents — CS game events (450–453)',
		candidates: m => {
			const b = m.slice(3).replace(/Id$/, '');
			return [`CMsgTE${b}`, `CMsg${b}`, `CMsgTE_${b}`];
		}
	}
];

/**
 * Members whose protobuf class the naming rules can't reach. Everything here was
 * checked against the generated ts-proto output by hand.
 */
const OVERRIDES: Record<string, string> = {
	'SVC_Messages.svc_UserCmds': 'CSVCMsg_UserCommands',
	'EBaseUserMessages.UM_AnimGraphUpdate': 'CUserMessageAnimStateGraphState',
	'EBaseUserMessages.UM_UtilActionResponse': 'CUserMessage_UtilMsg_Response',
	'EBaseUserMessages.UM_DllStatusResponse': 'CUserMessage_DllStatus',
	'EBaseUserMessages.UM_InventoryResponse': 'CUserMessage_Inventory_Response',
	'EBaseUserMessages.UM_DiagnosticResponse': 'CUserMessage_Diagnostic_Response',
	'ECstrike15UserMessages.CS_UM_DisconnectToLobby2': 'CCSUsrMsg_DisconnectToLobby',
	'ECsgoGameEvents.GE_RadioIconEventId': 'CMsgTERadioIcon'
};

/**
 * Members with no protobuf message in the current CS2 protos. Listing them keeps
 * the generator's "unresolved" report meaningful — anything not here is news.
 */
const KNOWN_UNMAPPED = new Set([
	'NET_Messages.net_Disconnect_Legacy', // dropped in Source 2
	'ECstrike15UserMessages.CS_UM_SayText', // CS:GO-era; CS2 sends UM_SayText
	'ECstrike15UserMessages.CS_UM_SayText2', // CS:GO-era; CS2 sends UM_SayText2
	'ECstrike15UserMessages.CS_UM_TextMsg', // CS:GO-era; CS2 sends UM_TextMsg
	'ECstrike15UserMessages.CS_UM_UpdateTeamMoney', // CS:GO-era, no CS2 proto
	'EBaseUserMessages.UM_UserSentBugBug' // enum member added 2026-08; no message defined yet
]);

/** Enum members that are bounds/sentinels rather than real wire ids. */
const isSentinel = (member: string) => member === 'UNRECOGNIZED' || /_MAX_BASE$/.test(member);

/** Event names owned by the parser itself — a message must never shadow one. */
const RESERVED_EVENT_NAMES = new Set([
	'progress',
	'end',
	'error',
	'tickstart',
	'tickend',
	'header',
	'broadcastsync',
	'gameeventlist',
	'gameevent',
	'clearallstringtables',
	'createstringtable',
	'updatestringtable',
	'serverinfo',
	'cancel',
	'debug',
	'entitycreated',
	'entityupdated',
	'entitydeleted',
	'anymessage',
	// Non-message keys that share the options object with ParseSettings.
	'entities',
	'stream',
	'fetcher',
	'signal'
]);

const classIndex = new Map<string, string>(); // class name -> import specifier
for (const { specifier, ns } of MODULES) {
	for (const [name, value] of Object.entries(ns)) {
		const v = value as { decode?: unknown } | undefined;
		if (v && typeof v === 'object' && typeof v.decode === 'function' && !classIndex.has(name)) {
			classIndex.set(name, specifier);
		}
	}
}

type Entry = { member: string; id: number; className: string; enumName: string; enumSpecifier: string };

const entries: Entry[] = [];
const sections: { label: string; entries: Entry[] }[] = [];
const unresolved: string[] = [];

for (const group of GROUPS) {
	const sectionEntries: Entry[] = [];
	for (const [member, rawId] of Object.entries(group.values)) {
		if (typeof rawId !== 'number' || rawId < 0 || isSentinel(member)) continue;

		const key = `${group.enumName}.${member}`;
		const className = OVERRIDES[key] ?? group.candidates(member).find(c => classIndex.has(c));

		if (!className) {
			if (!KNOWN_UNMAPPED.has(key))
				unresolved.push(`${key} (id ${rawId}) — tried ${group.candidates(member).join(', ')}`);
			continue;
		}
		if (!classIndex.has(className)) {
			unresolved.push(`${key} (id ${rawId}) — override "${className}" is not an exported message`);
			continue;
		}

		const entry: Entry = {
			member,
			id: rawId,
			className,
			enumName: group.enumName,
			enumSpecifier: group.specifier
		};
		sectionEntries.push(entry);
		entries.push(entry);
	}
	sections.push({ label: group.label, entries: sectionEntries });
}

// --- invariants -------------------------------------------------------------

const byId = new Map<number, Entry>();
const byName = new Map<string, Entry>();
const problems: string[] = [];

for (const e of entries) {
	const clashId = byId.get(e.id);
	if (clashId) problems.push(`duplicate wire id ${e.id}: ${clashId.member} and ${e.member}`);
	else byId.set(e.id, e);

	const clashName = byName.get(e.member);
	if (clashName) problems.push(`duplicate message name ${e.member}`);
	else byName.set(e.member, e);

	if (RESERVED_EVENT_NAMES.has(e.member))
		problems.push(`message name "${e.member}" collides with a parser-owned event`);
}

if (problems.length) {
	console.error('Registry invariants violated:\n  ' + problems.join('\n  '));
	process.exit(1);
}

// --- emit -------------------------------------------------------------------

const importsBySpecifier = new Map<string, Set<string>>();
const addImport = (specifier: string, name: string) => {
	let set = importsBySpecifier.get(specifier);
	if (!set) importsBySpecifier.set(specifier, (set = new Set()));
	set.add(name);
};
for (const e of entries) {
	addImport(classIndex.get(e.className)!, e.className);
	addImport(e.enumSpecifier, e.enumName);
}

const importBlock = MODULES.map(m => {
	const names = importsBySpecifier.get(m.specifier);
	if (!names?.size) return null;
	return `import {\n${[...names]
		.sort()
		.map(n => `\t${n}`)
		.join(',\n')}\n} from '${m.specifier}';`;
})
	.filter(Boolean)
	.join('\n');

const body = sections
	.filter(s => s.entries.length > 0)
	.map(s => {
		const rows = s.entries
			.map(e => `\t${e.member}: { id: ${e.enumName}.${e.member}, class: ${e.className} },`)
			.join('\n');
		return `\t// ${s.label}\n${rows}`;
	})
	.join('\n\n');

const unmappedNote = [...KNOWN_UNMAPPED]
	.sort()
	.map(k => `//   ${k}`)
	.join('\n');

const out = `// Code generated by scripts/generate-message-registry.ts. DO NOT EDIT.
//
// Every message that can appear at the top level of a DEM_Packet, keyed by its
// protobuf enum member name. The key doubles as the event name on DemoReader and
// as the ParseSettings flag, so adding a message here is all it takes to make it
// listenable.
//
// Regenerate after a protocol update:  bun run generate:messages
//
// Enum members with no protobuf message in the current CS2 protos:
${unmappedNote}

${importBlock}

export const messageRegistry = {
${body}
} as const;

export type MessageRegistry = typeof messageRegistry;

/** Every listenable network-message name. */
export type NetMessageName = keyof MessageRegistry;

/** Decoded payload type for a given message name. */
export type NetMessagePayload<K extends NetMessageName> = ReturnType<MessageRegistry[K]['class']['decode']>;
`;

const existing = fs.existsSync(OUT_FILE) ? fs.readFileSync(OUT_FILE, 'utf8') : null;

if (process.argv.includes('--check')) {
	if (existing !== out) {
		console.error(`${path.relative(ROOT, OUT_FILE)} is out of date — run: bun run generate:messages`);
		process.exit(1);
	}
	console.log(`${path.relative(ROOT, OUT_FILE)} is up to date (${entries.length} messages).`);
} else {
	fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
	fs.writeFileSync(OUT_FILE, out);
	console.log(`Wrote ${path.relative(ROOT, OUT_FILE)} — ${entries.length} messages across ${sections.length} enums.`);
}

if (unresolved.length) {
	console.warn(`\n${unresolved.length} enum member(s) could not be resolved to a protobuf class:`);
	for (const u of unresolved) console.warn(`  ${u}`);
	console.warn('\nAdd an entry to OVERRIDES or KNOWN_UNMAPPED in this script.');
	process.exitCode = 1;
}

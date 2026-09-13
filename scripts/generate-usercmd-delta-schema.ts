/**
 * Generates `src/parser/descriptors/generated/userCmdDeltaSchema.ts` — the field
 * layout and static direct readers the `codegen_delta_encoder` decoder needs.
 *
 * `CMsgServerUserCmd.delta_data` is not plain protobuf: a field may arrive with
 * wire type 7, meaning "reset to the declared default", and rebuilding that
 * requires knowing each field's normal wire type, its nested message type, and
 * its `[default = …]`. Valve marks the participating messages in the .proto with
 * `option (codegen_delta_encoder) = true`, so all of it can be read straight from
 * the source of truth instead of hand-maintained.
 *
 *   bun scripts/generate-usercmd-delta-schema.ts [--check]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { format, resolveConfig } from 'prettier';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PROTO_DIR = path.join(ROOT, 'src', 'proto');
const OUT_FILE = path.join(ROOT, 'src', 'parser', 'descriptors', 'generated', 'userCmdDeltaSchema.ts');
const DECODER_FILE = path.join(path.dirname(OUT_FILE), 'userCmdDeltaDecoders.ts');

/** Message the delta decoder starts from. */
const ROOT_MESSAGE = 'CSGOUserCmdPB';

type ProtoField = {
	label: 'optional' | 'repeated' | 'required';
	type: string;
	name: string;
	number: number;
	default?: string;
};
type ProtoMessage = { name: string; deltaEncoded: boolean; fields: ProtoField[]; unsupported: string[] };

// Only types with implemented default encodings belong here. New types must
// fail generation until their reset semantics are supported.
const WIRE_BY_TYPE: Record<string, 0 | 2 | 5> = {
	int32: 0,
	int64: 0,
	uint32: 0,
	uint64: 0,
	bool: 0,
	string: 2,
	bytes: 2,
	float: 5
};

// --- parse the .proto files --------------------------------------------------

const messages = new Map<string, ProtoMessage>();

const MESSAGE_RE = /^message\s+(\w+)\s*\{/;
const FIELD_RE = /^\s*(optional|repeated|required)\s+\.?([\w.]+)\s+(\w+)\s*=\s*(\d+)\s*(?:\[([^\]]*)\])?\s*;/;

for (const file of fs.readdirSync(PROTO_DIR).filter(f => f.endsWith('.proto'))) {
	const lines = fs.readFileSync(path.join(PROTO_DIR, file), 'utf8').split('\n');
	let current: ProtoMessage | null = null;
	let depth = 0;

	for (const line of lines) {
		if (!current) {
			const start = MESSAGE_RE.exec(line);
			if (start) {
				current = { name: start[1]!, deltaEncoded: false, fields: [], unsupported: [] };
				depth = 1;
			}
			continue;
		}

		if (/codegen_delta_encoder\s*\)\s*=\s*true/.test(line)) current.deltaEncoded = true;

		const field = FIELD_RE.exec(line);
		if (depth === 1 && !field && /^\s*(optional|repeated|required|map|oneof|extensions)\b/.test(line))
			current.unsupported.push(line.trim());
		// Only take fields at the message's own brace depth — nested messages and
		// enums declare their own and would otherwise be folded into the parent.
		if (field && depth === 1) {
			const options = field[5] ?? '';
			const def = /(?:^|,)\s*default\s*=\s*([^,]+)/.exec(options)?.[1]?.trim();
			current.fields.push({
				label: field[1] as ProtoField['label'],
				type: field[2]!.split('.').pop()!,
				name: field[3]!,
				number: Number(field[4]),
				default: def
			});
		}

		depth += (line.match(/\{/g)?.length ?? 0) - (line.match(/\}/g)?.length ?? 0);
		if (depth <= 0) {
			if (!messages.has(current.name)) messages.set(current.name, current);
			current = null;
		}
	}
}

// --- encode declared defaults ------------------------------------------------

const varintBytes = (value: bigint): number[] => {
	let v = BigInt.asUintN(64, value);
	const out: number[] = [];
	while (v >= 0x80n) {
		out.push(Number((v & 0x7fn) | 0x80n));
		v >>= 7n;
	}
	out.push(Number(v));
	return out;
};

const float32Bytes = (value: number): number[] => {
	const buf = new DataView(new ArrayBuffer(4));
	buf.setFloat32(0, value, true);
	return [buf.getUint8(0), buf.getUint8(1), buf.getUint8(2), buf.getUint8(3)];
};

/** Bytes that follow the key when resetting `field` to its declared default. */
const defaultPayload = (field: ProtoField, wire: 0 | 2 | 5): number[] => {
	const raw = field.default;
	switch (wire) {
		case 0: {
			if (raw === undefined) return [0];
			if (raw === 'true') return [1];
			if (raw === 'false') return [0];
			// Negative int32/int64 defaults encode as 64-bit two's complement.
			return varintBytes(BigInt(raw));
		}
		case 5:
			return float32Bytes(raw === undefined ? 0 : Number(raw));
		case 2:
			return []; // length + body are produced by the decoder
	}
};

// --- walk the closure from the root -----------------------------------------

type OutField = { wire: 0 | 2 | 5; child?: string; repeated?: boolean; def?: number[] };
type OutMessage = { name: string; fields: [number, OutField][] };

const emitted = new Map<string, OutMessage>();
const problems: string[] = [];

const visit = (name: string) => {
	if (emitted.has(name)) return;
	const message = messages.get(name);
	if (!message) {
		problems.push(`message ${name} not found in ${path.relative(ROOT, PROTO_DIR)}`);
		return;
	}
	if (!message.deltaEncoded) {
		problems.push(`message ${name} is referenced by the delta schema but lacks codegen_delta_encoder`);
		return;
	}
	for (const declaration of message.unsupported) problems.push(`${name}: unsupported declaration "${declaration}"`);

	const out: OutMessage = { name, fields: [] };
	emitted.set(name, out); // insert before recursing so cycles terminate

	for (const field of [...message.fields].sort((a, b) => a.number - b.number)) {
		const nested = messages.get(field.type);
		const isMessage = nested !== undefined;
		const wire = isMessage ? 2 : WIRE_BY_TYPE[field.type];
		if (wire === undefined) {
			problems.push(`${name}.${field.name}: unsupported type "${field.type}"`);
			continue;
		}

		if (field.label === 'repeated' && !nested?.deltaEncoded) {
			problems.push(`${name}.${field.name}: only repeated delta messages are supported`);
			continue;
		}
		if (wire === 2 && field.default !== undefined && field.default !== '""') {
			problems.push(`${name}.${field.name}: nonempty length-delimited defaults are unsupported`);
			continue;
		}
		const spec: OutField = { wire };
		// Only delta-encoded submessages take part; anything else stays opaque bytes.
		if (isMessage && nested.deltaEncoded) {
			spec.child = field.type;
			visit(field.type);
		}
		if (field.label === 'repeated') spec.repeated = true;
		if (wire !== 2) spec.def = defaultPayload(field, wire);

		out.fields.push([field.number, spec]);
	}
};

visit(ROOT_MESSAGE);

const checkCycles = (name: string, path: Set<string>) => {
	if (path.has(name)) {
		problems.push(`${name}: recursive delta reset semantics are unsupported`);
		return;
	}
	const next = new Set(path).add(name);
	for (const [, field] of emitted.get(name)?.fields ?? []) if (field.child) checkCycles(field.child, next);
};
checkCycles(ROOT_MESSAGE, new Set());

if (problems.length) {
	console.error('Delta schema could not be derived:\n  ' + problems.join('\n  '));
	process.exit(1);
}

// --- emit --------------------------------------------------------------------

const body = [...emitted.values()]
	.map(message => {
		const rows = message.fields
			.map(([number, spec]) => {
				const parts = [`wire: ${spec.wire}`];
				if (spec.child) parts.push(`child: '${spec.child}'`);
				if (spec.repeated) parts.push(`repeated: true`);
				if (spec.def) parts.push(`def: [${spec.def.join(', ')}]`);
				return `\t\t\t${number}: { ${parts.join(', ')} }`;
			})
			.join(',\n');
		return `\t${message.name}: {\n\t\tfields: {\n${rows}\n\t\t}\n\t}`;
	})
	.join(',\n');

const out = `// Code generated by scripts/generate-usercmd-delta-schema.ts. DO NOT EDIT.
//
// Field layout for the messages CS2 marks with \`option (codegen_delta_encoder)\`,
// reachable from ${ROOT_MESSAGE}. Used to decode \`CMsgServerUserCmd.delta_data\`,
// whose wire-type-7 fields mean "reset to the declared default" and therefore need
// each field's normal wire type, nested type and default value to reconstruct.
//
// Regenerate after a protocol update:  bun run generate:delta-schema

export type DeltaWireType = 0 | 2 | 5;

export type DeltaFieldSpec = {
	/** Wire type this field uses in its normal (non-delta) encoding. */
	wire: DeltaWireType;
	/** Nested delta-encoded message type, if this field holds one. Always a DeltaMessageName. */
	child?: string;
	/** Repeated fields arrive as replacement lists rather than plain repeats. */
	repeated?: boolean;
	/** Payload bytes for a wire-7 reset. Absent for length-delimited fields. */
	def?: readonly number[];
};

export const userCmdDeltaSchema = {
${body}
} as const satisfies Record<string, { fields: Record<number, DeltaFieldSpec> }>;

export type DeltaMessageName = keyof typeof userCmdDeltaSchema;

/** Message the delta decoder starts from. */
export const DELTA_ROOT_MESSAGE = '${ROOT_MESSAGE}' satisfies DeltaMessageName;
`;

const existing = fs.existsSync(OUT_FILE) ? fs.readFileSync(OUT_FILE, 'utf8') : null;

// Static readers preserve ts-proto's last-singular-message-wins behavior while
// accumulating replacement-list operations from every occurrence independently.
const hasLists = (name: string, seen = new Set<string>()): boolean => {
	if (seen.has(name)) return false;
	seen.add(name);
	return emitted.get(name)!.fields.some(([, spec]) => spec.repeated || (spec.child && hasLists(spec.child, seen)));
};
const listPath = (field: number) => `path ? path + '.${field}' : '${field}'`;
const defaultValue = (field: ProtoField): string => {
	const raw = field.default ?? '0';
	switch (field.type) {
		case 'bool':
			return raw === 'true' ? 'true' : 'false';
		case 'int32':
			return String(Number(BigInt.asIntN(32, BigInt(raw))));
		case 'uint32':
			return String(Number(BigInt.asUintN(32, BigInt(raw))));
		case 'int64':
			return JSON.stringify(String(BigInt.asIntN(64, BigInt(raw))));
		case 'uint64':
			return JSON.stringify(String(BigInt.asUintN(64, BigInt(raw))));
		case 'float': {
			const value = Math.fround(Number(raw));
			return Object.is(value, -0) ? '-0' : String(value);
		}
		case 'string':
			return "''";
		case 'bytes':
			return 'new Uint8Array(0)';
		default:
			throw new Error(`Unsupported scalar ${field.type}`);
	}
};
const functions = [...emitted.values()]
	.map(message => {
		const fields = messages.get(message.name)!.fields;
		const fresh = `{ ${fields.map(field => `${field.name}: ${field.label === 'repeated' ? '[]' : 'undefined'}`).join(', ')} }`;
		const locals = fields
			.filter(
				field =>
					emitted.get(message.name)!.fields.find(([id]) => id === field.number)?.[1].child &&
					field.label !== 'repeated'
			)
			.map(field => `const original${field.number} = result.${field.name};`)
			.join('\n');
		const repeated = fields
			.filter(field => field.label === 'repeated')
			.map(field => `result.${field.name} ??= [];`)
			.join('\n');
		const resets = fields
			.map(field => {
				const spec = message.fields.find(([id]) => id === field.number)![1];
				if (spec.repeated) return `appendList(lists, ${listPath(field.number)}, RESET_LIST);`;
				const value = spec.child
					? `reset${spec.child}(result.${field.name}, lists, ${hasLists(spec.child) ? listPath(field.number) : "''"})`
					: defaultValue(field);
				return `result.${field.name} = ${value};`;
			})
			.join('\n');
		const cases = fields
			.map(field => {
				const spec = message.fields.find(([id]) => id === field.number)![1];
				if (spec.repeated)
					return `case ${field.number}: {
			if ((tag & 7) === 7) appendList(lists, ${listPath(field.number)}, RESET_LIST);
			else { reader.wire(tag, 2); appendList(lists, ${listPath(field.number)}, reader.bytes(end)); }
			break;
		}`;
				const childPath = spec.child && hasLists(spec.child) ? listPath(field.number) : "''";
				const reset = spec.child
					? `reset${spec.child}(original${field.number}, lists, ${childPath})`
					: defaultValue(field);
				const read = spec.child
					? `decode${spec.child}(reader, reader.messageEnd(end), original${field.number}, lists, ${childPath}, fresh)`
					: field.type === 'bytes'
						? 'new Uint8Array(reader.bytes(end))'
						: `reader.${field.type}(end)`;
				return `case ${field.number}: {
			if ((tag & 7) === 7) result.${field.name} = ${reset};
			else { reader.wire(tag, ${spec.wire}); result.${field.name} = ${read}; }
			break;
		}`;
			})
			.join('\n');
		return `function reset${message.name}(baseline?: unknown, lists?: ListUpdates, path = ''): DeltaObject {
		const result = cloneMessage(baseline);
		${resets}
		${repeated}
		return result;
	}
	export function decode${message.name}(reader: DeltaReader, end: number, baseline?: unknown, lists?: ListUpdates, path = '', fresh = false): DeltaObject {
		const result: DeltaObject = fresh ? ${fresh} : cloneMessage(baseline);
		${locals}
		while (reader.pos < end) {
			const tag = reader.key(end);
			switch (tag >>> 3) {
				${cases}
				default: reader.skip(tag, end);
			}
		}
		${repeated}
		return result;
	}`;
	})
	.join('\n\n');
const decoderOut = await format(
	`// Code generated by scripts/generate-usercmd-delta-schema.ts. DO NOT EDIT.
// Direct delta readers derive field names, scalar types and defaults from the .proto files.
import { DeltaReader, cloneMessage, appendList, RESET_LIST, type DeltaObject, type ListUpdates } from '../../entities/userCmdDeltaReader.js';
${functions}
`,
	{ ...(await resolveConfig(OUT_FILE)), parser: 'typescript' }
);
const existingDecoder = fs.existsSync(DECODER_FILE) ? fs.readFileSync(DECODER_FILE, 'utf8') : null;

if (process.argv.includes('--check')) {
	if (existing !== out || existingDecoder !== decoderOut) {
		console.error(`${path.relative(ROOT, OUT_FILE)} is out of date — run: bun run generate:delta-schema`);
		process.exit(1);
	}
	console.log(`${path.relative(ROOT, OUT_FILE)} is up to date (${emitted.size} messages).`);
} else {
	fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
	fs.writeFileSync(OUT_FILE, out);
	fs.writeFileSync(DECODER_FILE, decoderOut);
	console.log(
		`Wrote ${path.relative(ROOT, OUT_FILE)} — ${emitted.size} delta-encoded messages, ` +
			`${[...emitted.values()].reduce((n, m) => n + m.fields.length, 0)} fields.`
	);
}

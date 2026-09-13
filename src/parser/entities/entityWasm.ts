import { entityWasmBase64 } from './entityWasmBytes.js';
import { Decoders } from './constructorFields.js';
import type { FieldPlan } from './entityParser.js';
import { fillHuffmanTables } from './fieldPaths.js';
import type { CSVCMsg_PacketEntities } from '../../ts-proto/netmessages.js';

interface Exports {
	memory: WebAssembly.Memory;
	ptr(which: number): number;
	packet(length: number, count: number, pvs: number): number;
}
let compiled: WebAssembly.Module | undefined;
const strings = new TextDecoder();
// Translate semantic decoders rather than coupling the C ABI to TS enum values.
const kinds = new Map<number, number>([
	[Decoders.VectorNormalDecoder, 1],
	[Decoders.VectorNoscaleDecoder, 2],
	[Decoders.VectorFloatCoordDecoder, 3],
	[Decoders.Unsigned64Decoder, 4],
	[Decoders.CentityHandleDecoder, 5],
	[Decoders.NoscaleDecoder, 6],
	[Decoders.BooleanDecoder, 7],
	[Decoders.StringDecoder, 8],
	[Decoders.SignedDecoder, 9],
	[Decoders.UnsignedDecoder, 10],
	[Decoders.ComponentDecoder, 11],
	[Decoders.FloatCoordDecoder, 12],
	[Decoders.FloatSimulationTimeDecoder, 13],
	[Decoders.Fixed64Decoder, 14],
	[Decoders.QanglePitchYawDecoder, 15],
	[Decoders.Qangle3Decoder, 16],
	[Decoders.QangleVarDecoder, 17],
	[Decoders.BaseDecoder, 18],
	[Decoders.AmmoDecoder, 19],
	[Decoders.QanglePresDecoder, 20],
	[Decoders.GameModeRulesDecoder, 21],
	[Decoders.BinaryBlockDecoder, 22]
]);

/** Internal acceleration only; the JS parser remains the fallback/error oracle. */
export class EntityWasm {
	readonly plans: (FieldPlan | null)[] = [null];
	readonly records: Uint32Array;
	readonly values: Float64Array;
	enabled = true;
	private readonly wasm: Exports;
	private readonly nodeInts: Int32Array;
	private readonly nodeFloats: Float64Array;
	private readonly edges: Uint32Array;
	private readonly roots: Uint32Array;
	private readonly entities: Int32Array;
	private readonly input: Uint8Array;
	private readonly bytes: Uint8Array;
	private readonly resultView: DataView;
	private readonly position: Uint32Array;
	private readonly known = new WeakMap<FieldPlan, number>();
	private readonly classes = new Set<number>();
	private edgeCount = 0;

	constructor(private getPlans: (classId: number) => (FieldPlan | null)[]) {
		if (new Uint8Array(new Uint32Array([1]).buffer)[0] !== 1) throw new Error('Unsupported host byte order');
		compiled ??= new WebAssembly.Module(Uint8Array.from(atob(entityWasmBase64), c => c.charCodeAt(0)));
		this.wasm = new WebAssembly.Instance(compiled).exports as unknown as Exports;
		const memory = this.wasm.memory.buffer;
		const ptr = (which: number) => this.wasm.ptr(which);
		this.nodeInts = new Int32Array(memory, ptr(0), 65536 * 14);
		this.nodeFloats = new Float64Array(memory, ptr(0), 65536 * 7);
		this.edges = new Uint32Array(memory, ptr(1), 262144);
		this.roots = new Uint32Array(memory, ptr(2), 2048);
		this.entities = new Int32Array(memory, ptr(3), 100001);
		this.entities.fill(-1);
		fillHuffmanTables(new Uint16Array(memory, ptr(4), 256), new Uint16Array(memory, ptr(5), 131072));
		this.records = new Uint32Array(memory, ptr(6), 65536 * 14);
		this.values = new Float64Array(memory, ptr(6), 65536 * 7);
		this.resultView = new DataView(memory, ptr(6));
		this.input = new Uint8Array(memory, ptr(7), 1048576);
		this.bytes = new Uint8Array(memory, ptr(8), 1048576);
		this.position = new Uint32Array(memory, ptr(10), 1);
	}

	private plan(info: FieldPlan | null): number {
		if (!info) return 0;
		const known = this.known.get(info);
		if (known) return known;
		const id = this.plans.length;
		if (id >= 65536) throw new Error('Entity plan capacity');
		this.plans.push(info);
		this.known.set(info, id);
		const i = id * 14,
			d = id * 7,
			decoder = info.decoder;
		this.nodeInts[i] = typeof decoder === 'object' ? 0 : (kinds.get(decoder) ?? -1);
		this.nodeInts[i + 1] = info.indexDepth;
		this.nodeInts[i + 5] = info.meta ? 1 : 0;
		if (typeof decoder === 'object') {
			const q = decoder.decoder;
			this.nodeInts[i + 6] = q.flags;
			this.nodeInts[i + 7] = q.bit_count;
			this.nodeFloats[d + 4] = q.low;
			this.nodeFloats[d + 5] = q.high;
			this.nodeFloats[d + 6] = q.dec_mul;
		}
		if (info.children) {
			const start = this.edgeCount;
			this.edgeCount += info.children.length;
			if (this.edgeCount > this.edges.length) throw new Error('Entity edge capacity');
			this.nodeInts[i + 2] = start;
			this.nodeInts[i + 3] = info.children.length;
			for (let j = 0; j < info.children.length; j++) this.edges[start + j] = this.plan(info.children[j]!);
		}
		if (info.element) this.nodeInts[i + 4] = this.plan(info.element);
		return id;
	}

	setEntity(id: number, classId: number): void {
		if (!this.enabled) return;
		try {
			if (
				!Number.isInteger(id) ||
				!Number.isInteger(classId) ||
				id < 0 ||
				id >= this.entities.length ||
				classId < 0 ||
				classId >= 1024
			)
				throw new Error('Entity table capacity');
			if (!this.classes.has(classId)) {
				const roots = this.getPlans(classId);
				const start = this.edgeCount;
				this.edgeCount += roots.length;
				if (this.edgeCount > this.edges.length) throw new Error('Entity root capacity');
				this.roots[classId * 2] = start;
				this.roots[classId * 2 + 1] = roots.length;
				for (let j = 0; j < roots.length; j++) this.edges[start + j] = this.plan(roots[j]!);
				this.classes.add(classId);
			}
			this.entities[id] = classId;
		} catch {
			// Partial tables must never execute. JS retains support for larger schemas.
			this.enabled = false;
		}
	}
	deleteEntity(id: number): void {
		this.entities[id] = -1;
	}
	decode(message: CSVCMsg_PacketEntities): number {
		const bytes = message.entity_data;
		const count = message.updated_entries ?? 0;
		if (
			!this.enabled ||
			!(bytes instanceof Uint8Array) ||
			bytes.length > this.input.length ||
			!Number.isInteger(count) ||
			count < 0 ||
			count > 0xffffffff
		)
			return -1;
		this.input.set(bytes);
		return this.wasm.packet(bytes.length, count, (message.has_pvs_vis_bits_deprecated ?? 0) > 0 ? 1 : 0);
	}
	get consumedBits(): number {
		return this.position[0]!;
	}
	value(index: number): unknown {
		const i = index * 14,
			d = index * 7;
		switch (this.records[i + 4]) {
			case 0:
				return this.values[d + 4]!;
			case 1:
				return this.values[d + 4] !== 0;
			case 2:
				return [this.values[d + 4]!, this.values[d + 5]!, this.values[d + 6]!];
			case 3:
				return this.records[i + 6] === 0
					? BigInt(this.records[i + 5]!)
					: this.resultView.getBigUint64(index * 56 + 20, true);
			case 4:
				return strings.decode(
					this.bytes.subarray(this.values[d + 4]!, this.values[d + 4]! + this.values[d + 5]!)
				);
			case 5:
				return this.bytes.slice(this.values[d + 4]!, this.values[d + 4]! + this.values[d + 5]!);
			default:
				throw new Error('Invalid entity result kind');
		}
	}
}

/** Runtime primitives shared by the generated delta message readers. */
export class DeltaFormatError extends Error {}
export type DeltaObject = Record<string, unknown>;
export type ListUpdates = Record<string, Uint8Array[]>;
export const RESET_LIST = Uint8Array.of(7);

export const cloneMessage = (value: unknown): DeltaObject =>
	value !== null && typeof value === 'object' && !Array.isArray(value) && !ArrayBuffer.isView(value)
		? { ...value }
		: {};

export const appendList = (lists: ListUpdates | undefined, path: string, bytes: Uint8Array): void => {
	if (!lists) throw new DeltaFormatError('nested replacement lists are unsupported');
	(lists[path] ??= []).push(bytes);
};

const strings = new TextDecoder('utf-8');

export class DeltaReader {
	pos = 0;
	private high = 0;
	private view?: DataView;
	constructor(readonly data: Uint8Array) {}

	key(end: number): number {
		let value = 0;
		for (let shift = 0; shift < 35; shift += 7) {
			if (this.pos >= end) throw new DeltaFormatError('truncated varint');
			const byte = this.data[this.pos++]!;
			if (shift === 28 && byte > 15) throw new DeltaFormatError('uint32 varint overflow');
			value |= (byte & 127) << shift;
			if (byte < 128) return value >>> 0;
		}
		throw new DeltaFormatError('varint too long');
	}

	/** Scalar varints permit ten bytes even for int32/uint32, but must fit uint64. */
	uint32(end: number): number {
		if (this.pos >= end) throw new DeltaFormatError('truncated varint');
		let byte = this.data[this.pos++]!;
		this.high = 0;
		if (byte < 128) return byte;
		let low = byte & 127;
		for (let count = 1; count < 10; count++) {
			if (this.pos >= end) throw new DeltaFormatError('truncated varint');
			byte = this.data[this.pos++]!;
			if (count < 4) low |= (byte & 127) << (count * 7);
			else if (count === 4) {
				low |= (byte & 15) << 28;
				this.high = (byte & 112) >>> 4;
			} else {
				if (count === 9 && byte > 1) throw new DeltaFormatError('uint64 varint overflow');
				this.high |= (byte & 127) << (count * 7 - 32);
			}
			if (byte < 128) return low >>> 0;
		}
		throw new DeltaFormatError('varint too long');
	}

	int32(end: number): number {
		return this.uint32(end) | 0;
	}
	bool(end: number): boolean {
		return this.uint32(end) !== 0 || this.high !== 0;
	}
	uint64(end: number): string {
		const low = this.uint32(end);
		return this.high === 0 ? String(low) : String((BigInt(this.high >>> 0) << 32n) | BigInt(low));
	}
	int64(end: number): string {
		const low = this.uint32(end);
		return this.high === 0 ? String(low) : String((BigInt(this.high) << 32n) | BigInt(low));
	}
	float(end: number): number {
		if (end - this.pos < 4) throw new DeltaFormatError('truncated float');
		this.view ??= new DataView(this.data.buffer, this.data.byteOffset, this.data.byteLength);
		const value = this.view.getFloat32(this.pos, true);
		this.pos += 4;
		return value;
	}
	messageEnd(end: number): number {
		const length = this.key(end);
		if (length > end - this.pos) throw new DeltaFormatError('truncated field');
		return this.pos + length;
	}
	bytes(end: number): Uint8Array {
		const next = this.messageEnd(end);
		const bytes = this.data.subarray(this.pos, next);
		this.pos = next;
		return bytes;
	}
	string(end: number): string {
		return strings.decode(this.bytes(end));
	}
	wire(tag: number, expected: number): void {
		if ((tag & 7) !== expected) throw new DeltaFormatError('wrong wire type');
	}
	skip(tag: number, end: number): void {
		if (tag >>> 3 === 0) throw new DeltaFormatError('field number 0');
		switch (tag & 7) {
			case 0:
				this.uint32(end);
				return;
			case 1:
				if (end - this.pos < 8) throw new DeltaFormatError('truncated field');
				this.pos += 8;
				return;
			case 2:
				this.pos = this.messageEnd(end);
				return;
			case 5:
				if (end - this.pos < 4) throw new DeltaFormatError('truncated field');
				this.pos += 4;
				return;
			default:
				throw new DeltaFormatError('unsupported wire type');
		}
	}
}

export function decodeReplacementList<T>(
	payloads: Uint8Array[],
	decode: (
		reader: DeltaReader,
		end: number,
		baseline?: unknown,
		lists?: ListUpdates,
		path?: string,
		fresh?: boolean
	) => DeltaObject,
	baseline: readonly T[]
): T[] {
	const items: (T | undefined)[] = [...baseline];
	for (const payload of payloads) {
		const reader = new DeltaReader(payload);
		while (reader.pos < payload.length) {
			const tag = reader.key(payload.length);
			const index = tag >>> 3;
			if ((tag & 7) === 7) {
				if (index > 4096) throw new DeltaFormatError('repeated field length out of range');
				items.length = index;
			} else {
				reader.wire(tag, 2);
				if (index >= 4096) throw new DeltaFormatError('repeated element index out of range');
				items[index] = decode(reader, reader.messageEnd(payload.length), undefined, undefined, '', true) as T;
			}
		}
	}
	for (const item of items) if (item === undefined) throw new DeltaFormatError('repeated element was never provided');
	return items as T[];
}

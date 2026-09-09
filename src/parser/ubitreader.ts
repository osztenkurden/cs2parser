// Internal 33-element mask for hot-path use (avoids branches for 0 and 32)
const MASK = new Uint32Array(33);
for (let i = 1; i < 32; ++i) {
	MASK[i] = (1 << i) - 1;
}
MASK[32] = 0xffffffff;

const BIT_COORD_FRAC_SCALE = 1 / 32;
const BIT_COORD_PRES_SCALE = 360 / (1 << 20);

const _f32ReinterpretF = new Float32Array(1);
const _f32ReinterpretU = new Uint32Array(_f32ReinterpretF.buffer);
const _u64ReinterpretBytes = new Uint8Array(8);
const _u64Reinterpret = new DataView(_u64ReinterpretBytes.buffer);

// Keep error construction out of the hot read methods' inlining budgets.
function exhausted(): never {
	throw new RangeError('BitBuffer exhausted');
}

export class BitBuffer {
	private static readonly _stringDecoder = new TextDecoder('utf-8');
	private static readonly _stringScratch = new Uint8Array(4096);
	public _bitsAvail = 0;
	public _buf = 0;
	private _pointer: Uint8Array;
	_byteOffset = 0;
	private _pointerView: DataView;

	constructor(pointer: Uint8Array) {
		this._pointer = pointer;
		this._pointerView = new DataView(this._pointer.buffer);
		this.FetchNext();
	}

	setTo(newPointer: Uint8Array) {
		if (newPointer.buffer !== this._pointer.buffer) {
			this._pointerView = new DataView(newPointer.buffer);
		}
		this._pointer = newPointer;
		this._buf = 0;
		this._bitsAvail = 0;
		this._byteOffset = 0;

		this.FetchNext();
		return this;
	}

	public readString() {
		let scratch = BitBuffer._stringScratch;
		let len = 0;
		let c: number;
		while ((c = this.ReadByte()) !== 0) {
			if (len === scratch.length) {
				const grown = new Uint8Array(scratch.length * 2);
				grown.set(scratch);
				scratch = grown;
			}
			scratch[len++] = c;
		}
		if (len === 0) return '';
		return BitBuffer._stringDecoder.decode(scratch.subarray(0, len));
	}

	public get RemainingBytes() {
		return this._pointer.length - this._byteOffset + Math.floor(this._bitsAvail / 8);
	}

	public get RemainingBits() {
		return (this._pointer.length - this._byteOffset) * 8 + this._bitsAvail;
	}

	private FetchNext() {
		this._bitsAvail =
			this._pointer.length - this._byteOffset >= 4 ? 32 : (this._pointer.length - this._byteOffset) * 8;
		this.UpdateBuffer();
	}
	/**
	 * Peek the 17 bits a Huffman field-path code needs, without consuming them.
	 *
	 * Specialised because it is the single hottest read in the parser — once per
	 * field-path operation, millions of times per demo — and because 17 bits do not
	 * fit the 32-bit window about half the time, so the spanning branch is taken
	 * constantly. Reading the next word byte-by-byte beats going through the
	 * DataView here, and hardcoding the width drops two mask-table lookups.
	 */
	public peekHuffmanCode(): number {
		const avail = this._bitsAvail;
		if (avail >= 17) return (this._buf & 0x1ffff) >>> 0;

		const pointer = this._pointer;
		const offset = this._byteOffset;
		let next: number;
		if (pointer.length - offset >= 4) {
			next =
				(pointer[offset]! |
					(pointer[offset + 1]! << 8) |
					(pointer[offset + 2]! << 16) |
					(pointer[offset + 3]! << 24)) >>>
				0;
		} else {
			next = 0;
			const bytesToRead = Math.min(pointer.length - offset, 4);
			for (let i = 0; i < bytesToRead; i++) next |= pointer[offset + i]! << (i * 8);
		}

		// `next << avail` is a 32-bit shift, but only the low 17 bits are kept and
		// avail < 17, so every bit that survives the mask is in the right place.
		return ((this._buf | (next << avail)) & 0x1ffff) >>> 0;
	}

	/** Zero-padded 8-bit primary Huffman lookup; consumption checks the actual code length. */
	public peekHuffmanPrefix(): number {
		const avail = this._bitsAvail;
		if (avail >= 8) return this._buf & 0xff;
		return ((avail ? this._buf : 0) | ((this._pointer[this._byteOffset] ?? 0) << avail)) & 0xff;
	}

	public PeekUBitsWithLog(numBits: number): number {
		if (this._bitsAvail >= numBits) {
			return (this._buf & MASK[numBits]!) >>> 0;
		} else {
			let ret = this._buf;
			const remainingBits = numBits - this._bitsAvail;

			// SIMULATING UPDATE BUFFER, WITHOUT REALLY MODIFYING THE READER
			let selfBuf: number;
			if (this._pointer.length - this._byteOffset >= 4) {
				selfBuf = this._pointerView.getUint32(this._pointer.byteOffset + this._byteOffset, true);
			} else {
				selfBuf = 0;
				const bytesToRead = Math.min(this._pointer.length - this._byteOffset, 4);
				for (let i = 0; i < bytesToRead; i++) {
					selfBuf |= this._pointer[this._byteOffset + i]! << (i * 8);
				}
			}

			ret |= (selfBuf & MASK[remainingBits]!) << this._bitsAvail;

			return ret >>> 0;
		}
	}

	/** Consume an integer width of 0-32 bits; no prior peek is required. Exhaustion leaves the cursor unchanged. */
	public consumePeeked(numBits: number): void {
		if (this._bitsAvail >= numBits) {
			this._bitsAvail -= numBits;
			if (this._bitsAvail !== 0) {
				this._buf >>>= numBits;
			} else {
				this.FetchNext();
			}
		} else {
			this._readUBitsSlow(numBits);
		}
	}
	/** Read an integer width of 0-32 bits. Exhaustion throws before consuming any bits. */
	public ReadUBits(numBits: number) {
		if (this._bitsAvail >= numBits) {
			const ret = this._buf & MASK[numBits]!;
			this._bitsAvail -= numBits;
			if (this._bitsAvail !== 0) {
				this._buf >>>= numBits;
			} else {
				this.FetchNext();
			}
			return ret >>> 0;
		}
		return this._readUBitsSlow(numBits);
	}
	private _readUBitsSlow(numBits: number) {
		let ret = this._buf;
		const savedBitsAvail = this._bitsAvail;
		numBits -= this._bitsAvail;

		const remainingBytes = this._pointer.length - this._byteOffset;
		const nextChunkBits = Math.min(remainingBytes, 4) * 8;
		if (numBits > nextChunkBits) exhausted();

		this.UpdateBuffer();

		ret |= (this._buf & MASK[numBits]!) << savedBitsAvail;
		this._bitsAvail = nextChunkBits - numBits;
		this._buf >>>= numBits;

		return ret >>> 0;
	}
	public readBoolean() {
		if (this._bitsAvail === 0) exhausted();
		const ret = this._buf & 1;
		this._bitsAvail--;
		if (this._bitsAvail !== 0) {
			this._buf >>>= 1;
		} else {
			this.FetchNext();
		}
		return ret !== 0;
	}

	public ReadByte() {
		return this.ReadUBits(8);
	}

	public readFloat32LE(): number {
		let bits: number;
		if (this._bitsAvail === 32) {
			bits = this._buf >>> 0;
			this._bitsAvail = 0;
			this.FetchNext();
		} else {
			bits = this.ReadUBits(32);
		}
		if (bits === 0) return 0;
		_f32ReinterpretU[0] = bits;
		return _f32ReinterpretF[0]!;
	}

	private UpdateBuffer() {
		if (this._pointer.length - this._byteOffset < 4) {
			this._buf = 0;
			for (let i = 0; i < this._pointer.length - this._byteOffset; ++i) {
				this._buf |= this._pointer[this._byteOffset + i]! << (i * 8);
			}
			this._byteOffset = this._pointer.length;
		} else {
			this._buf = this._pointerView.getUint32(this._pointer.byteOffset + this._byteOffset, true);
			this._byteOffset += 4;
		}
	}

	readBytes = (outputBuffer: Uint8Array) => {
		this._readBytesInto(outputBuffer, outputBuffer.length);
	};

	readBytesToSlice = (outputBuffer: Uint8Array, size: number) => {
		this._readBytesInto(outputBuffer, size);
		return outputBuffer.subarray(0, size);
	};

	private _readBytesInto(out: Uint8Array, size: number) {
		if (!Number.isSafeInteger(size) || size < 0 || size > out.length) {
			throw new RangeError('Invalid byte copy size');
		}
		if (size > this.RemainingBytes) exhausted();
		let written = 0;

		// Phase 1: drain whole bytes from current bit buffer
		while (this._bitsAvail >= 8 && written < size) {
			out[written++] = this._buf & 0xff;
			this._buf >>>= 8;
			this._bitsAvail -= 8;
		}

		if (written >= size) {
			if (this._bitsAvail === 0) this.FetchNext();
			return;
		}

		if (this._bitsAvail === 0) {
			// Phase 2a: byte-aligned — direct memcpy from source
			const direct = size - written;
			out.set(this._pointer.subarray(this._byteOffset, this._byteOffset + direct), written);
			this._byteOffset += direct;
			this.FetchNext();
		} else {
			// Phase 2b: non-byte-aligned — shift-copy loop
			// Each output byte = carry_low_bits | (src_byte << shift)
			const shift = this._bitsAvail; // 1-7 bits in carry
			const invShift = 8 - shift;
			let carry = this._buf; // low 'shift' bits are valid
			const count = size - written;

			let i = 0;
			if (count >= 16) {
				// Word loads with byte stores avoid alignment restrictions and an output DataView allocation.
				const sourceOffset = this._pointer.byteOffset + this._byteOffset;
				for (; i + 4 <= count; i += 4) {
					const word = this._pointerView.getUint32(sourceOffset + i, true);
					const value = carry | (word << shift);
					out[written + i] = value;
					out[written + i + 1] = value >>> 8;
					out[written + i + 2] = value >>> 16;
					out[written + i + 3] = value >>> 24;
					carry = word >>> (32 - shift);
				}
			}
			for (; i < count; i++) {
				const src = this._pointer[this._byteOffset + i]!;
				out[written + i] = (carry | (src << shift)) & 0xff;
				carry = src >>> invShift;
			}

			this._byteOffset += count;
			this._buf = carry;
			// _bitsAvail stays the same (shift bits in carry)
		}
	}

	skipBytesBetter = (bytes: number) => {
		if (!Number.isSafeInteger(bytes) || bytes < 0) throw new RangeError('Invalid byte skip size');
		if (bytes > this.RemainingBytes) exhausted();
		const bitsToSkip = bytes * 8;

		if (bitsToSkip <= this._bitsAvail) {
			// Skip entirely within current buffer
			this._bitsAvail -= bitsToSkip;
			if (this._bitsAvail !== 0) {
				this._buf >>>= bitsToSkip;
			} else {
				this.FetchNext();
			}
			return;
		}

		// Compute new absolute bit position and jump
		const currentBitPos = this._byteOffset * 8 - this._bitsAvail;
		const newBitPos = currentBitPos + bitsToSkip;
		const alignedByteOffset = Math.floor(newBitPos / 32) * 4;
		const bitsIntoChunk = newBitPos & 31;

		this._byteOffset = alignedByteOffset;
		this.FetchNext();

		if (bitsIntoChunk > 0) {
			this._bitsAvail -= bitsIntoChunk;
			this._buf >>>= bitsIntoChunk;
		}
	};

	public readUbitVar = () => {
		let ret = this.ReadUBits(6);
		switch (ret & (16 | 32)) {
			case 16:
				ret = (ret & 15) | (this.ReadUBits(4) << 4);
				break;
			case 32:
				ret = (ret & 15) | (this.ReadUBits(8) << 4);
				break;
			case 48:
				ret = ((ret & 15) | ((this.ReadUBits(32 - 4) << 4) >>> 0)) >>> 0;
				break;
		}
		return ret >>> 0;
	};
	public ReadUVarInt32() {
		// Fast path: 1-byte varint (most common)
		if (this._bitsAvail >= 8) {
			const b0 = this._buf & 0xff;
			if ((b0 & 0x80) === 0) {
				this._bitsAvail -= 8;
				if (this._bitsAvail !== 0) {
					this._buf >>>= 8;
				} else {
					this.FetchNext();
				}
				return b0;
			}
			// Fast path: 2-byte varint
			if (this._bitsAvail >= 16) {
				const b1 = (this._buf >>> 8) & 0xff;
				if ((b1 & 0x80) === 0) {
					this._bitsAvail -= 16;
					if (this._bitsAvail !== 0) {
						this._buf >>>= 16;
					} else {
						this.FetchNext();
					}
					return ((b0 & 0x7f) | (b1 << 7)) >>> 0;
				}
			}
		}
		// Fall back to general loop for longer varints
		let result = 0;
		let count = 0;
		let byteRead: number;
		do {
			if (count >= 5) return result >>> 0;
			byteRead = this.ReadByte();
			result |= (byteRead & 0x7f) << (7 * count);
			count++;
		} while ((byteRead & 0x80) !== 0);
		return result >>> 0;
	}
	readUbitVarFp() {
		if (this.readBoolean()) return this.ReadUBits(2);
		if (this.readBoolean()) return this.ReadUBits(4);
		if (this.readBoolean()) return this.ReadUBits(10);
		if (this.readBoolean()) return this.ReadUBits(17);
		return this.ReadUBits(31);
	}
	readVarInt32() {
		const val = this.ReadUVarInt32();
		return (val >>> 1) ^ -(val & 1);
	}
	readUVarInt64() {
		let low = 0;
		let high = 0;
		for (let count = 0; ; count++) {
			const b = this.ReadByte();
			if (count < 4) {
				low |= (b & 0x7f) << (count * 7);
			} else if (count === 4) {
				// The fifth byte straddles the two 32-bit words.
				low |= (b & 0x0f) << 28;
				high = (b & 0x70) >>> 4;
			} else {
				if (count === 9 && b > 1) throw new Error('MALFORMED U64');
				high |= (b & 0x7f) << (count * 7 - 32);
			}
			if ((b & 0x80) === 0) {
				if (high === 0) return BigInt(low >>> 0);
				_u64Reinterpret.setUint32(0, low, true);
				_u64Reinterpret.setUint32(4, high, true);
				return _u64Reinterpret.getBigUint64(0, true);
			}
		}
	}
	decudeUint64() {
		if (this._bitsAvail === 32 && this.RemainingBytes >= 8) {
			_u64Reinterpret.setUint32(0, this.ReadUBits(32), true);
			_u64Reinterpret.setUint32(4, this.ReadUBits(32), true);
		} else {
			this.readBytes(_u64ReinterpretBytes);
		}
		return _u64Reinterpret.getBigUint64(0, true);
	}
	decode_noscale() {
		return this.ReadUBits(32);
	}
	decodeVectorNoScale() {
		// Each component is a raw 32-bit float, same wire shape as scalar D_NOSCALE.
		// (`decode_noscale` returns the uint32 bit pattern without reinterpreting —
		// used by readAngle for fixed-point fractions; not what we want for vec3.)
		return [this.readFloat32LE(), this.readFloat32LE(), this.readFloat32LE()];
	}
	decodeQangleAll3() {
		return [this.decode_noscale(), this.decode_noscale(), this.decode_noscale()];
	}

	readAngle(n: number) {
		return this.decode_noscale() / (1 << n);
	}

	decodeQanglePitchYaw() {
		return [this.readAngle(32), this.readAngle(32), this.readAngle(32)];
	}

	decodeFloatCoord() {
		return this.readBitCoord();
	}

	decodeVectorFloatCoord() {
		return [this.decodeFloatCoord(), this.decodeFloatCoord(), this.decodeFloatCoord()];
	}

	readBitCoord() {
		let intVal = 0;
		let fracVal = 0;

		const int2 = this.readBoolean();
		const f2 = this.readBoolean();

		if (!int2 && !f2) {
			return 0;
		}

		const sign = this.readBoolean();

		if (int2) {
			intVal = this.ReadUBits(14) + 1;
		}

		if (f2) {
			fracVal = this.ReadUBits(5);
		}

		const result = Math.fround(intVal + fracVal * BIT_COORD_FRAC_SCALE);

		if (sign) return -result;
		return result;
	}

	readBitCoordPres() {
		return this.ReadUBits(20) * BIT_COORD_PRES_SCALE - 180;
	}

	decodeAmmo() {
		const ammo = this.ReadUVarInt32();
		if (ammo > 0) return ammo - 1;
		return ammo;
	}

	decodeNormal() {
		const isNegative = this.readBoolean();
		const length = this.ReadUBits(11);

		const result = length * (1 / 2048 - 1);
		if (isNegative) return -result;
		return result;
	}

	decodeNormalVec() {
		const v = [0, 0, 0];
		const hasX = this.readBoolean();
		const hasY = this.readBoolean();
		if (hasX) v[0] = this.decodeNormal();
		if (hasY) v[1] = this.decodeNormal();

		const neg_z = this.readBoolean();

		const prod_sum = v[0]! ** 2 + v[1]! ** 2;
		if (prod_sum < 1) {
			v[2] = Math.sqrt(1 - prod_sum);
		} else {
			v[2] = 0;
		}

		if (neg_z) {
			v[2] = -v[2];
		}
		return v;
	}

	decodeQangleVariant() {
		const flags = this.ReadUBits(3);
		const result = [0, 0, 0];

		if (flags & 1) result[0] = this.readBitCoord();
		if (flags & 2) result[1] = this.readBitCoord();
		if (flags & 4) result[2] = this.readBitCoord();

		return result;
	}

	decodeQangleVariantPres() {
		const flags = this.ReadUBits(3);
		const result = [0, 0, 0];

		if (flags & 1) result[0] = this.readBitCoordPres();
		if (flags & 2) result[1] = this.readBitCoordPres();
		if (flags & 4) result[2] = this.readBitCoordPres();

		return result;
	}
}

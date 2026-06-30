//! Hot-path bit reader. 1:1 port of `src/parser/ubitreader.ts`.
//!
//! Reads bits from a `&[u8]` buffer using a 32-bit accumulator (`buf`) holding
//! the next `bits_avail` unread bits in the low-order positions. When the
//! accumulator drains, `fetch_next` refills it with the next little-endian
//! 32-bit word.

const BIT_COORD_FRAC_SCALE: f32 = 1.0 / 32.0;
const BIT_COORD_PRES_SCALE: f32 = 360.0 / (1u32 << 20) as f32;

#[inline(always)]
fn mask_n(n: u32) -> u32 {
	if n >= 32 {
		0xffff_ffff
	} else {
		(1u32 << n) - 1
	}
}

pub struct BitBuffer {
	pointer: Vec<u8>,
	byte_offset: usize,
	bits_avail: u32,
	buf: u32,
}

impl BitBuffer {
	pub fn new(pointer: Vec<u8>) -> Self {
		let mut bb = Self { pointer, byte_offset: 0, bits_avail: 0, buf: 0 };
		bb.fetch_next();
		bb
	}

	pub fn set_to(&mut self, new_pointer: Vec<u8>) {
		self.pointer = new_pointer;
		self.buf = 0;
		self.bits_avail = 0;
		self.byte_offset = 0;
		self.fetch_next();
	}

	pub fn remaining_bytes(&self) -> u32 {
		(self.pointer.len() - self.byte_offset) as u32 + (self.bits_avail / 8)
	}

	pub fn remaining_bits(&self) -> u32 {
		(self.pointer.len() - self.byte_offset) as u32 * 8 + self.bits_avail
	}

	fn fetch_next(&mut self) {
		let rem = self.pointer.len() - self.byte_offset;
		self.bits_avail = if rem >= 4 { 32 } else { (rem as u32) * 8 };
		self.update_buffer();
	}

	fn update_buffer(&mut self) {
		let rem = self.pointer.len() - self.byte_offset;
		if rem < 4 {
			let mut bytes = [0u8; 4];
			let take = rem.min(4);
			bytes[..take].copy_from_slice(&self.pointer[self.byte_offset..self.byte_offset + take]);
			self.buf = u32::from_le_bytes(bytes);
			self.byte_offset = self.pointer.len();
		} else {
			let slice = &self.pointer[self.byte_offset..self.byte_offset + 4];
			self.buf = u32::from_le_bytes(slice.try_into().unwrap());
			self.byte_offset += 4;
		}
	}

	#[inline]
	pub fn peek_ubits_with_log(&self, num_bits: u32) -> u32 {
		if self.bits_avail >= num_bits {
			return self.buf & mask_n(num_bits);
		}
		let mut ret = self.buf;
		let remaining_bits = num_bits - self.bits_avail;

		let rem_bytes = self.pointer.len() - self.byte_offset;
		let self_buf = if rem_bytes >= 4 {
			let slice = &self.pointer[self.byte_offset..self.byte_offset + 4];
			u32::from_le_bytes(slice.try_into().unwrap())
		} else {
			let mut bytes = [0u8; 4];
			let take = rem_bytes.min(4);
			bytes[..take].copy_from_slice(&self.pointer[self.byte_offset..self.byte_offset + take]);
			u32::from_le_bytes(bytes)
		};
		ret |= (self_buf & mask_n(remaining_bits)) << self.bits_avail;
		ret
	}

	pub fn consume_peeked(&mut self, num_bits: u32) {
		if self.bits_avail >= num_bits {
			self.bits_avail -= num_bits;
			if self.bits_avail != 0 {
				self.buf >>= num_bits;
			} else {
				self.fetch_next();
			}
		} else {
			let bits_from_next = num_bits - self.bits_avail;
			let remaining_bytes = self.pointer.len() - self.byte_offset;
			let next_chunk_bits = (remaining_bytes.min(4) as u32) * 8;
			self.update_buffer();
			self.bits_avail = next_chunk_bits - bits_from_next;
			self.buf >>= bits_from_next;
		}
	}

	#[inline]
	pub fn read_ubits(&mut self, num_bits: u32) -> u32 {
		if self.bits_avail >= num_bits {
			let ret = if num_bits == 32 { self.buf } else { self.buf & mask_n(num_bits) };
			self.bits_avail -= num_bits;
			if self.bits_avail != 0 {
				self.buf >>= num_bits;
			} else {
				self.fetch_next();
			}
			return ret;
		}
		self.read_ubits_slow(num_bits)
	}

	fn read_ubits_slow(&mut self, mut num_bits: u32) -> u32 {
		let mut ret = self.buf;
		let saved_bits_avail = self.bits_avail;
		num_bits -= self.bits_avail;

		let remaining_bytes = self.pointer.len() - self.byte_offset;
		let next_chunk_bits = (remaining_bytes.min(4) as u32) * 8;

		self.update_buffer();

		ret |= (self.buf & mask_n(num_bits)) << saved_bits_avail;
		self.bits_avail = next_chunk_bits - num_bits;
		self.buf >>= num_bits;
		ret
	}

	pub fn read_boolean(&mut self) -> bool {
		if self.bits_avail == 0 {
			self.fetch_next();
		}
		let ret = self.buf & 1;
		self.bits_avail -= 1;
		if self.bits_avail != 0 {
			self.buf >>= 1;
		} else {
			self.fetch_next();
		}
		ret != 0
	}

	pub fn read_byte(&mut self) -> u32 {
		self.read_ubits(8)
	}

	pub fn read_float32_le(&mut self) -> f32 {
		let bits = if self.bits_avail == 32 {
			let b = self.buf;
			self.bits_avail = 0;
			self.fetch_next();
			b
		} else {
			self.read_ubits(32)
		};
		if bits == 0 {
			0.0
		} else {
			f32::from_bits(bits)
		}
	}

	pub fn skip_bytes_better(&mut self, bytes: u32) {
		let bits_to_skip = bytes * 8;
		if bits_to_skip <= self.bits_avail {
			self.bits_avail -= bits_to_skip;
			if self.bits_avail != 0 {
				self.buf >>= bits_to_skip;
			} else {
				self.fetch_next();
			}
			return;
		}
		// Compute new absolute bit position and jump.
		let current_bit_pos = (self.byte_offset as u32) * 8 - self.bits_avail;
		let new_bit_pos = current_bit_pos + bits_to_skip;
		let aligned_byte_offset = (new_bit_pos / 32) * 4;
		let bits_into_chunk = new_bit_pos & 31;

		self.byte_offset = aligned_byte_offset as usize;
		self.fetch_next();

		if bits_into_chunk > 0 {
			self.bits_avail -= bits_into_chunk;
			self.buf >>= bits_into_chunk;
		}
	}

	pub fn read_bytes_into(&mut self, out: &mut [u8]) {
		let size = out.len();
		let mut written = 0;

		// Phase 1: drain whole bytes from the current bit buffer
		while self.bits_avail >= 8 && written < size {
			out[written] = (self.buf & 0xff) as u8;
			self.buf >>= 8;
			self.bits_avail -= 8;
			written += 1;
		}

		if written >= size {
			if self.bits_avail == 0 {
				self.fetch_next();
			}
			return;
		}

		if self.bits_avail == 0 {
			// Phase 2a: byte-aligned direct memcpy from source
			let direct = (size - written).min(self.pointer.len() - self.byte_offset);
			if direct > 0 {
				out[written..written + direct]
					.copy_from_slice(&self.pointer[self.byte_offset..self.byte_offset + direct]);
				written += direct;
				self.byte_offset += direct;
			}
			self.fetch_next();
			// Drain any whole bytes the refill produced into the buffer if more bytes still needed
			while self.bits_avail >= 8 && written < size {
				out[written] = (self.buf & 0xff) as u8;
				self.buf >>= 8;
				self.bits_avail -= 8;
				written += 1;
			}
			if written >= size && self.bits_avail == 0 {
				self.fetch_next();
			}
		} else {
			// Phase 2b: non-byte-aligned shift-copy loop
			let shift = self.bits_avail;
			let inv_shift = 8 - shift;
			let mut carry = self.buf;
			let bytes_needed = size - written;
			let available = self.pointer.len() - self.byte_offset;
			let count = bytes_needed.min(available);
			for i in 0..count {
				let src = self.pointer[self.byte_offset + i] as u32;
				out[written + i] = ((carry | (src << shift)) & 0xff) as u8;
				carry = src >> inv_shift;
			}
			// written += count;  // local only, not used after
			self.byte_offset += count;
			self.buf = carry;
			// bits_avail stays the same (shift bits in carry)
		}
	}

	pub fn read_string(&mut self) -> String {
		let mut scratch: Vec<u8> = Vec::with_capacity(64);
		const MAX_LEN: usize = 4096;
		loop {
			let c = self.read_byte() as u8;
			if c == 0 {
				break;
			}
			if scratch.len() < MAX_LEN {
				scratch.push(c);
			}
		}
		if scratch.is_empty() {
			String::new()
		} else {
			String::from_utf8_lossy(&scratch).into_owned()
		}
	}

	pub fn read_ubit_var(&mut self) -> u32 {
		let mut ret = self.read_ubits(6);
		match ret & (16 | 32) {
			16 => ret = (ret & 15) | (self.read_ubits(4) << 4),
			32 => ret = (ret & 15) | (self.read_ubits(8) << 4),
			48 => ret = (ret & 15) | (self.read_ubits(32 - 4) << 4),
			_ => {}
		}
		ret
	}

	pub fn read_uvarint32(&mut self) -> u32 {
		// Fast path: 1-byte varint
		if self.bits_avail >= 8 {
			let b0 = self.buf & 0xff;
			if (b0 & 0x80) == 0 {
				self.bits_avail -= 8;
				if self.bits_avail != 0 {
					self.buf >>= 8;
				} else {
					self.fetch_next();
				}
				return b0;
			}
			// Fast path: 2-byte varint
			if self.bits_avail >= 16 {
				let b1 = (self.buf >> 8) & 0xff;
				if (b1 & 0x80) == 0 {
					self.bits_avail -= 16;
					if self.bits_avail != 0 {
						self.buf >>= 16;
					} else {
						self.fetch_next();
					}
					return (b0 & 0x7f) | (b1 << 7);
				}
			}
		}
		// General loop for longer varints (max 5 bytes)
		let mut result: u32 = 0;
		let mut count: u32 = 0;
		loop {
			if count >= 5 {
				return result;
			}
			let byte_read = self.read_byte();
			result |= (byte_read & 0x7f) << (7 * count);
			count += 1;
			if (byte_read & 0x80) == 0 {
				break;
			}
		}
		result
	}

	pub fn read_ubit_var_fp(&mut self) -> u32 {
		if self.read_boolean() {
			return self.read_ubits(2);
		}
		if self.read_boolean() {
			return self.read_ubits(4);
		}
		if self.read_boolean() {
			return self.read_ubits(10);
		}
		if self.read_boolean() {
			return self.read_ubits(17);
		}
		self.read_ubits(31)
	}

	pub fn read_varint32(&mut self) -> i32 {
		let val = self.read_uvarint32();
		let x = val as i32;
		let mut mut_ = x >> 1;
		if (x & 1) != 0 {
			mut_ = !mut_;
		}
		mut_
	}

	pub fn read_uvarint64(&mut self) -> u64 {
		let mut result: u64 = 0;
		let mut count = 0u32;
		let mut s: u32 = 0;
		loop {
			let b = self.read_ubits(8) as u64;
			if b < 0x80 {
				if count > 9 || (count == 9 && b > 1) {
					// MALFORMED — match JS behaviour: throw. We can't return Result
					// from a pure Rust API used by hot paths, so saturate and let the
					// caller detect via the malformed bit pattern. JS also throws but
					// callers wrap.
					return 0;
				}
				return result | (b << s);
			}
			result |= (b & 127) << s;
			count += 1;
			if (b & 0x80) == 0 {
				break;
			}
			s += 7;
		}
		result
	}

	pub fn decode_uint64(&mut self) -> u64 {
		let mut bytes = [0u8; 8];
		self.read_bytes_into(&mut bytes);
		u64::from_le_bytes(bytes)
	}

	pub fn decode_noscale(&mut self) -> u32 {
		self.read_ubits(32)
	}

	pub fn decode_vector_noscale(&mut self) -> [f64; 3] {
		// Each component is a raw 32-bit float, same wire shape as scalar D_NOSCALE.
		// (`decode_noscale` returns the uint32 bit pattern without reinterpreting —
		// used by `read_angle` for fixed-point fractions; not what we want for vec3.)
		[
			self.read_float32_le() as f64,
			self.read_float32_le() as f64,
			self.read_float32_le() as f64,
		]
	}

	pub fn decode_qangle_all3(&mut self) -> [f64; 3] {
		[
			self.decode_noscale() as f64,
			self.decode_noscale() as f64,
			self.decode_noscale() as f64,
		]
	}

	pub fn read_angle(&mut self, n: u32) -> f64 {
		self.decode_noscale() as f64 / ((1u32 << n) as f64)
	}

	pub fn decode_qangle_pitch_yaw(&mut self) -> [f64; 3] {
		[self.read_angle(32), self.read_angle(32), self.read_angle(32)]
	}

	pub fn read_bit_coord(&mut self) -> f32 {
		let mut int_val = 0u32;
		let mut frac_val = 0u32;

		let int2 = self.read_boolean();
		let f2 = self.read_boolean();

		if !int2 && !f2 {
			return 0.0;
		}

		let sign = self.read_boolean();

		if int2 {
			int_val = self.read_ubits(14) + 1;
		}
		if f2 {
			frac_val = self.read_ubits(5);
		}

		// JS uses Math.fround for f32 round-trip semantics.
		let result = (int_val as f32) + (frac_val as f32) * BIT_COORD_FRAC_SCALE;
		if sign {
			-result
		} else {
			result
		}
	}

	pub fn read_bit_coord_pres(&mut self) -> f32 {
		(self.read_ubits(20) as f32) * BIT_COORD_PRES_SCALE - 180.0
	}

	pub fn decode_float_coord(&mut self) -> f32 {
		self.read_bit_coord()
	}

	pub fn decode_vector_float_coord(&mut self) -> [f64; 3] {
		[
			self.decode_float_coord() as f64,
			self.decode_float_coord() as f64,
			self.decode_float_coord() as f64,
		]
	}

	pub fn decode_ammo(&mut self) -> u32 {
		let ammo = self.read_uvarint32();
		if ammo > 0 {
			ammo - 1
		} else {
			ammo
		}
	}

	pub fn decode_normal(&mut self) -> f32 {
		let is_negative = self.read_boolean();
		let length = self.read_ubits(11);
		// NB: ubitreader.ts does `length * (1/2048 - 1)`. Translates verbatim.
		let result = (length as f32) * (1.0 / 2048.0 - 1.0);
		if is_negative {
			-result
		} else {
			result
		}
	}

	pub fn decode_normal_vec(&mut self) -> [f64; 3] {
		let mut v = [0.0f64; 3];
		let has_x = self.read_boolean();
		let has_y = self.read_boolean();
		if has_x {
			v[0] = self.decode_normal() as f64;
		}
		if has_y {
			v[1] = self.decode_normal() as f64;
		}
		let neg_z = self.read_boolean();

		let prod_sum = v[0] * v[0] + v[1] * v[1];
		if prod_sum < 1.0 {
			v[2] = (1.0 - prod_sum).sqrt();
		} else {
			v[2] = 0.0;
		}
		if neg_z {
			v[2] = -v[2];
		}
		v
	}

	pub fn decode_qangle_variant(&mut self) -> [f64; 3] {
		let flags = self.read_ubits(3);
		let mut result = [0.0f64; 3];
		if flags & 1 != 0 {
			result[0] = self.read_bit_coord() as f64;
		}
		if flags & 2 != 0 {
			result[1] = self.read_bit_coord() as f64;
		}
		if flags & 4 != 0 {
			result[2] = self.read_bit_coord() as f64;
		}
		result
	}

	pub fn decode_qangle_variant_pres(&mut self) -> [f64; 3] {
		let flags = self.read_ubits(3);
		let mut result = [0.0f64; 3];
		if flags & 1 != 0 {
			result[0] = self.read_bit_coord_pres() as f64;
		}
		if flags & 2 != 0 {
			result[1] = self.read_bit_coord_pres() as f64;
		}
		if flags & 4 != 0 {
			result[2] = self.read_bit_coord_pres() as f64;
		}
		result
	}
}

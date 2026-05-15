//! Quantized-float decoder. 1:1 port of `src/parser/entities/quantizedFloat.ts`.
//!
//! At classInfo time each quantized field gets a precomputed `QuantizedFloat`
//! holding range, step count, multipliers, and an offset for rounding flags.
//! At decode time `decode_qfloat` reads `bit_count` bits and linearly maps
//! them back into [low, high].

use crate::bitbuffer::BitBuffer;

pub const QFF_ROUNDDOWN: u32 = 1 << 0;
pub const QFF_ROUNDUP: u32 = 1 << 1;
pub const QFF_ENCODE_ZERO: u32 = 1 << 2;
pub const QFF_ENCODE_INTEGERS: u32 = 1 << 3;

#[derive(Clone, Copy, Debug, PartialEq)]
pub struct QuantizedFloat {
	pub low: f32,
	pub high: f32,
	pub high_low_mul: f32,
	pub dec_mul: f32,
	pub offset: f32,
	pub bit_count: u32,
	pub flags: u32,
	pub no_scale: bool,
}

const Q_FLOAT_MULTIPLIERS: [f32; 5] = [0.9999, 0.99, 0.9, 0.8, 0.7];

fn assign_multipliers(qf: &mut QuantizedFloat, steps: u32) {
	qf.high_low_mul = 0.0;
	let range = qf.high - qf.low;
	let high: u32 = if qf.bit_count == 32 { 0xffff_fffe } else { (1u32 << qf.bit_count) - 1 };
	let mut high_mul: f32 = if range.abs() <= 0.0 { high as f32 } else { (high as f32) / range };
	if high_mul * range > high as f32 || high_mul * range > high as f32 {
		for &multiplier in Q_FLOAT_MULTIPLIERS.iter() {
			high_mul = ((high as f32) / range) * multiplier;
			if high_mul * range > high as f32 || high_mul * range > high as f32 {
				continue;
			}
			break;
		}
	}
	qf.high_low_mul = high_mul;
	qf.dec_mul = 1.0 / ((steps - 1) as f32);
}

fn quantize(qf: &QuantizedFloat, val: f32) -> f32 {
	if val < qf.low {
		return qf.low;
	}
	if val > qf.high {
		return qf.high;
	}
	let i = ((val - qf.low) * qf.high_low_mul).floor() as u32;
	qf.low + (qf.high - qf.low) * (i as f32 * qf.dec_mul)
}

fn validate_flags(qf: &mut QuantizedFloat) {
	if qf.flags == 0 {
		return;
	}
	if (qf.low == 0.0 && (qf.flags & QFF_ROUNDDOWN) != 0)
		|| (qf.high == 0.0 && (qf.flags & QFF_ROUNDUP) != 0)
	{
		qf.flags &= !QFF_ENCODE_ZERO;
	}
	if qf.low == 0.0 && (qf.flags & QFF_ENCODE_ZERO) != 0 {
		qf.flags |= QFF_ROUNDDOWN;
		qf.flags &= !QFF_ENCODE_ZERO;
	}
	if qf.high == 0.0 && (qf.flags & QFF_ENCODE_ZERO) != 0 {
		qf.flags |= QFF_ROUNDUP;
		qf.flags &= !QFF_ENCODE_ZERO;
	}
	if qf.low > 0.0 || qf.high < 0.0 {
		qf.flags &= !QFF_ENCODE_ZERO;
	}
	if (qf.flags & QFF_ENCODE_INTEGERS) != 0 {
		qf.flags &= !(QFF_ROUNDUP | QFF_ROUNDDOWN | QFF_ENCODE_ZERO);
	}
}

/// Constructs a QuantizedFloat from the field's wire-format parameters. Called
/// once per quantized-float field at classInfo time.
pub fn get_quantized_float(bitcount: u32, flags: Option<u32>, low_value: Option<f32>, high_value: Option<f32>) -> QuantizedFloat {
	let mut qf = QuantizedFloat {
		no_scale: false,
		bit_count: bitcount,
		dec_mul: 0.0,
		low: 0.0,
		high: 0.0,
		high_low_mul: 0.0,
		offset: 0.0,
		flags: 0,
	};

	if bitcount == 0 || bitcount >= 32 {
		qf.no_scale = true;
		qf.bit_count = 32;
		return qf;
	}
	qf.bit_count = bitcount;
	if let Some(v) = low_value {
		qf.low = v;
	}
	if let Some(v) = high_value {
		qf.high = v;
	}
	if let Some(f) = flags {
		qf.flags = f;
		validate_flags(&mut qf);
	}

	let mut steps: u32 = 1u32 << qf.bit_count;

	if (qf.flags & QFF_ROUNDDOWN) != 0 {
		let range = qf.high - qf.low;
		qf.offset = range / (steps as f32);
		qf.high -= qf.offset;
	} else if (qf.flags & QFF_ROUNDUP) != 0 {
		let range = qf.high - qf.low;
		qf.offset = range / (steps as f32);
		qf.low += qf.offset;
	}

	if (qf.flags & QFF_ENCODE_INTEGERS) != 0 {
		let mut delta = qf.high - qf.low;
		if delta < 1.0 {
			delta = 1.0;
		}
		let delta_log2 = (delta as f64).log2().ceil() as u32;
		let range_2 = 1u32 << delta_log2;
		let mut bit_count = qf.bit_count;
		while (1u32 << bit_count) <= range_2 {
			bit_count += 1;
		}
		if bit_count > qf.bit_count {
			qf.bit_count = bit_count;
			steps = 1u32 << qf.bit_count;
		}
		qf.offset = (range_2 as f32) / (steps as f32);
		qf.high = qf.low + (range_2 as f32 - qf.offset);
	}

	assign_multipliers(&mut qf, steps);

	if (qf.flags & QFF_ROUNDDOWN) != 0 && quantize(&qf, qf.low) == qf.low {
		qf.flags &= !QFF_ROUNDDOWN;
	}
	if (qf.flags & QFF_ROUNDUP) != 0 && quantize(&qf, qf.high) == qf.high {
		qf.flags &= !QFF_ROUNDUP;
	}
	if (qf.flags & QFF_ENCODE_ZERO) != 0 && quantize(&qf, 0.0) == 0.0 {
		qf.flags &= !QFF_ENCODE_ZERO;
	}

	qf
}

#[allow(dead_code)]
pub fn decode_qfloat(br: &mut BitBuffer, qf: &QuantizedFloat) -> f32 {
	if qf.flags != 0 {
		if (qf.flags & QFF_ROUNDDOWN) != 0 && br.read_boolean() {
			return qf.low;
		}
		if (qf.flags & QFF_ROUNDUP) != 0 && br.read_boolean() {
			return qf.high;
		}
		if (qf.flags & QFF_ENCODE_ZERO) != 0 && br.read_boolean() {
			return 0.0;
		}
	}
	let bits = br.read_ubits(qf.bit_count);
	qf.low + (qf.high - qf.low) * (bits as f32) * qf.dec_mul
}

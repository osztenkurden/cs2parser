//! Field-path Huffman decoder. 1:1 port of `src/parser/entities/fieldPathOps.ts`
//! and `src/parser/entities/fieldPaths.ts`.
//!
//! Each entity update encodes a stream of field-path edits as Huffman-prefixed
//! opcodes (0–39). The decoder walks the stream until it sees the STOP symbol
//! (39) and emits a series of `FieldPath` snapshots.

use crate::bitbuffer::BitBuffer;

/// Mirrors the JS `FieldPath` type: a [-1..N]-bounded 7-deep position into the
/// entity field tree, with `last` indexing the deepest valid slot.
#[derive(Clone, Copy, Debug)]
pub struct FieldPath {
	pub path: [i32; 7],
	pub last: i32,
}

impl FieldPath {
	pub const fn new() -> Self {
		Self { path: [-1, 0, 0, 0, 0, 0, 0], last: 0 }
	}

	/// Reset to the initial parsePaths state (path[0] = -1). Used by the
	/// Phase-5 entity decoder; allowed dead-code until then.
	#[allow(dead_code)]
	pub fn reset(&mut self) {
		self.path = [-1, 0, 0, 0, 0, 0, 0];
		self.last = 0;
	}
}

#[inline]
fn last(fp: &FieldPath) -> usize {
	fp.last as usize
}

pub fn pop_special(fp: &mut FieldPath, n: i32) {
	for _ in 0..n {
		fp.path[last(fp)] = 0;
		fp.last -= 1;
	}
}

// ─── Plus ────────────────────────────────────────────────────────────────────

fn plus_one(_: &mut BitBuffer, fp: &mut FieldPath) {
	fp.path[last(fp)] += 1;
}
fn plus_two(_: &mut BitBuffer, fp: &mut FieldPath) {
	fp.path[last(fp)] += 2;
}
fn plus_three(_: &mut BitBuffer, fp: &mut FieldPath) {
	fp.path[last(fp)] += 3;
}
fn plus_four(_: &mut BitBuffer, fp: &mut FieldPath) {
	fp.path[last(fp)] += 4;
}
fn plus_n(br: &mut BitBuffer, fp: &mut FieldPath) {
	fp.path[last(fp)] += br.read_ubit_var_fp() as i32 + 5;
}

// ─── Push ────────────────────────────────────────────────────────────────────

fn push_one_left_delta_zero_right_zero(_: &mut BitBuffer, fp: &mut FieldPath) {
	fp.last += 1;
	fp.path[last(fp)] = 0;
}

fn push_one_left_delta_zero_right_non_zero(br: &mut BitBuffer, fp: &mut FieldPath) {
	fp.last += 1;
	fp.path[last(fp)] += br.read_ubit_var_fp() as i32;
}

fn push_one_left_delta_one_right_zero(_: &mut BitBuffer, fp: &mut FieldPath) {
	fp.path[last(fp)] += 1;
	fp.last += 1;
	fp.path[last(fp)] = 0;
}

fn push_one_left_delta_one_right_non_zero(br: &mut BitBuffer, fp: &mut FieldPath) {
	fp.path[last(fp)] += 1;
	fp.last += 1;
	fp.path[last(fp)] = br.read_ubit_var_fp() as i32;
}

fn push_one_left_delta_n_right_zero(br: &mut BitBuffer, fp: &mut FieldPath) {
	fp.path[last(fp)] += br.read_ubit_var_fp() as i32;
	fp.last += 1;
	fp.path[last(fp)] = 0;
}

fn push_one_left_delta_n_right_non_zero(br: &mut BitBuffer, fp: &mut FieldPath) {
	fp.path[last(fp)] += br.read_ubit_var_fp() as i32 + 2;
	fp.last += 1;
	fp.path[last(fp)] = br.read_ubit_var_fp() as i32 + 1;
}

fn push_one_left_delta_n_right_non_zero_pack6_bits(br: &mut BitBuffer, fp: &mut FieldPath) {
	fp.path[last(fp)] += br.read_ubits(3) as i32 + 2;
	fp.last += 1;
	fp.path[last(fp)] = br.read_ubits(3) as i32 + 1;
}

fn push_one_left_delta_n_right_non_zero_pack8_bits(br: &mut BitBuffer, fp: &mut FieldPath) {
	fp.path[last(fp)] += br.read_ubits(4) as i32 + 2;
	fp.last += 1;
	fp.path[last(fp)] = br.read_ubits(4) as i32 + 1;
}

fn push_two_left_delta_zero(br: &mut BitBuffer, fp: &mut FieldPath) {
	fp.last += 1;
	fp.path[last(fp)] += br.read_ubit_var_fp() as i32;
	fp.last += 1;
	fp.path[last(fp)] += br.read_ubit_var_fp() as i32;
}

fn push_two_pack5_left_delta_zero(br: &mut BitBuffer, fp: &mut FieldPath) {
	fp.last += 1;
	fp.path[last(fp)] = br.read_ubits(5) as i32;
	fp.last += 1;
	fp.path[last(fp)] = br.read_ubits(5) as i32;
}

fn push_three_left_delta_zero(br: &mut BitBuffer, fp: &mut FieldPath) {
	fp.last += 1;
	fp.path[last(fp)] += br.read_ubit_var_fp() as i32;
	fp.last += 1;
	fp.path[last(fp)] += br.read_ubit_var_fp() as i32;
	fp.last += 1;
	fp.path[last(fp)] += br.read_ubit_var_fp() as i32;
}

fn push_three_pack5_left_delta_zero(br: &mut BitBuffer, fp: &mut FieldPath) {
	fp.last += 1;
	fp.path[last(fp)] = br.read_ubits(5) as i32;
	fp.last += 1;
	fp.path[last(fp)] = br.read_ubits(5) as i32;
	fp.last += 1;
	fp.path[last(fp)] = br.read_ubits(5) as i32;
}

fn push_two_left_delta_one(br: &mut BitBuffer, fp: &mut FieldPath) {
	fp.path[last(fp)] += 1;
	fp.last += 1;
	fp.path[last(fp)] += br.read_ubit_var_fp() as i32;
	fp.last += 1;
	fp.path[last(fp)] += br.read_ubit_var_fp() as i32;
}

fn push_two_pack5_left_delta_one(br: &mut BitBuffer, fp: &mut FieldPath) {
	fp.path[last(fp)] += 1;
	fp.last += 1;
	fp.path[last(fp)] += br.read_ubits(5) as i32;
	fp.last += 1;
	fp.path[last(fp)] += br.read_ubits(5) as i32;
}

fn push_three_left_delta_one(br: &mut BitBuffer, fp: &mut FieldPath) {
	fp.path[last(fp)] += 1;
	fp.last += 1;
	fp.path[last(fp)] += br.read_ubit_var_fp() as i32;
	fp.last += 1;
	fp.path[last(fp)] += br.read_ubit_var_fp() as i32;
	fp.last += 1;
	fp.path[last(fp)] += br.read_ubit_var_fp() as i32;
}

fn push_three_pack5_left_delta_one(br: &mut BitBuffer, fp: &mut FieldPath) {
	fp.path[last(fp)] += 1;
	fp.last += 1;
	fp.path[last(fp)] += br.read_ubits(5) as i32;
	fp.last += 1;
	fp.path[last(fp)] += br.read_ubits(5) as i32;
	fp.last += 1;
	fp.path[last(fp)] += br.read_ubits(5) as i32;
}

fn push_two_left_delta_n(br: &mut BitBuffer, fp: &mut FieldPath) {
	fp.path[last(fp)] += br.read_ubit_var() as i32 + 2;
	fp.last += 1;
	fp.path[last(fp)] += br.read_ubit_var_fp() as i32;
	fp.last += 1;
	fp.path[last(fp)] += br.read_ubit_var_fp() as i32;
}

fn push_two_pack5_left_delta_n(br: &mut BitBuffer, fp: &mut FieldPath) {
	fp.path[last(fp)] += br.read_ubit_var() as i32 + 2;
	fp.last += 1;
	fp.path[last(fp)] += br.read_ubits(5) as i32;
	fp.last += 1;
	fp.path[last(fp)] += br.read_ubits(5) as i32;
}

fn push_three_left_delta_n(br: &mut BitBuffer, fp: &mut FieldPath) {
	fp.path[last(fp)] += br.read_ubit_var() as i32 + 2;
	fp.last += 1;
	fp.path[last(fp)] += br.read_ubit_var_fp() as i32;
	fp.last += 1;
	fp.path[last(fp)] += br.read_ubit_var_fp() as i32;
	fp.last += 1;
	fp.path[last(fp)] += br.read_ubit_var_fp() as i32;
}

fn push_three_pack5_left_delta_n(br: &mut BitBuffer, fp: &mut FieldPath) {
	fp.path[last(fp)] += br.read_ubit_var() as i32 + 2;
	fp.last += 1;
	fp.path[last(fp)] += br.read_ubits(5) as i32;
	fp.last += 1;
	fp.path[last(fp)] += br.read_ubits(5) as i32;
	fp.last += 1;
	fp.path[last(fp)] += br.read_ubits(5) as i32;
}

fn push_n(br: &mut BitBuffer, fp: &mut FieldPath) {
	let n = br.read_ubit_var();
	fp.path[last(fp)] += br.read_ubit_var() as i32;
	for _ in 0..n {
		fp.last += 1;
		fp.path[last(fp)] += br.read_ubit_var_fp() as i32;
	}
}

fn push_n_and_non_topological(br: &mut BitBuffer, fp: &mut FieldPath) {
	for i in 0..=last(fp) {
		if br.read_boolean() {
			fp.path[i] += br.read_varint32() + 1;
		}
	}
	let count = br.read_ubit_var();
	for _ in 0..count {
		fp.last += 1;
		fp.path[last(fp)] = br.read_ubit_var_fp() as i32;
	}
}

// ─── Pop ─────────────────────────────────────────────────────────────────────

fn pop_one_plus_one(_: &mut BitBuffer, fp: &mut FieldPath) {
	pop_special(fp, 1);
	fp.path[last(fp)] += 1;
}

fn pop_one_plus_n(br: &mut BitBuffer, fp: &mut FieldPath) {
	pop_special(fp, 1);
	fp.path[last(fp)] += br.read_ubit_var_fp() as i32 + 1;
}

fn pop_all_but_one_plus_one(_: &mut BitBuffer, fp: &mut FieldPath) {
	pop_special(fp, fp.last);
	fp.path[0] += 1;
}

fn pop_all_but_one_plus_n(br: &mut BitBuffer, fp: &mut FieldPath) {
	pop_special(fp, fp.last);
	fp.path[0] += br.read_ubit_var_fp() as i32 + 1;
}

fn pop_all_but_one_plus_n_pack3_bits(br: &mut BitBuffer, fp: &mut FieldPath) {
	pop_special(fp, fp.last);
	fp.path[0] += br.read_ubits(3) as i32 + 1;
}

fn pop_all_but_one_plus_n_pack6_bits(br: &mut BitBuffer, fp: &mut FieldPath) {
	pop_special(fp, fp.last);
	fp.path[0] += br.read_ubits(6) as i32 + 1;
}

fn pop_n_plus_one(br: &mut BitBuffer, fp: &mut FieldPath) {
	pop_special(fp, br.read_ubit_var_fp() as i32);
	fp.path[last(fp)] += 1;
}

fn pop_n_plus_n(br: &mut BitBuffer, fp: &mut FieldPath) {
	pop_special(fp, br.read_ubit_var_fp() as i32);
	fp.path[last(fp)] += br.read_varint32();
}

fn pop_n_and_non_topographical(br: &mut BitBuffer, fp: &mut FieldPath) {
	pop_special(fp, br.read_ubit_var_fp() as i32);
	for i in 0..=last(fp) {
		if br.read_boolean() {
			fp.path[i] += br.read_varint32();
		}
	}
}

// ─── Non-topological ─────────────────────────────────────────────────────────

fn non_topo_complex(br: &mut BitBuffer, fp: &mut FieldPath) {
	for i in 0..=last(fp) {
		if br.read_boolean() {
			fp.path[i] += br.read_varint32();
		}
	}
}

fn non_topo_penultimate_plus_one(_: &mut BitBuffer, fp: &mut FieldPath) {
	let idx = (fp.last - 1) as usize;
	fp.path[idx] += 1;
}

fn non_topo_complex_pack4_bits(br: &mut BitBuffer, fp: &mut FieldPath) {
	for i in 0..=last(fp) {
		if br.read_boolean() {
			fp.path[i] += br.read_ubits(4) as i32 - 7;
		}
	}
}

/// Dispatch one opcode. Returns `Err` if `opcode > 39`. Opcode 39 is the
/// stop marker — handled by the caller; `do_op` itself is a no-op there.
pub fn do_op(opcode: u32, br: &mut BitBuffer, fp: &mut FieldPath) -> Result<(), &'static str> {
	match opcode {
		0 => plus_one(br, fp),
		1 => plus_two(br, fp),
		2 => plus_three(br, fp),
		3 => plus_four(br, fp),
		4 => plus_n(br, fp),
		5 => push_one_left_delta_zero_right_zero(br, fp),
		6 => push_one_left_delta_zero_right_non_zero(br, fp),
		7 => push_one_left_delta_one_right_zero(br, fp),
		8 => push_one_left_delta_one_right_non_zero(br, fp),
		9 => push_one_left_delta_n_right_zero(br, fp),
		10 => push_one_left_delta_n_right_non_zero(br, fp),
		11 => push_one_left_delta_n_right_non_zero_pack6_bits(br, fp),
		12 => push_one_left_delta_n_right_non_zero_pack8_bits(br, fp),
		13 => push_two_left_delta_zero(br, fp),
		14 => push_two_pack5_left_delta_zero(br, fp),
		15 => push_three_left_delta_zero(br, fp),
		16 => push_three_pack5_left_delta_zero(br, fp),
		17 => push_two_left_delta_one(br, fp),
		18 => push_two_pack5_left_delta_one(br, fp),
		19 => push_three_left_delta_one(br, fp),
		20 => push_three_pack5_left_delta_one(br, fp),
		21 => push_two_left_delta_n(br, fp),
		22 => push_two_pack5_left_delta_n(br, fp),
		23 => push_three_left_delta_n(br, fp),
		24 => push_three_pack5_left_delta_n(br, fp),
		25 => push_n(br, fp),
		26 => push_n_and_non_topological(br, fp),
		27 => pop_one_plus_one(br, fp),
		28 => pop_one_plus_n(br, fp),
		29 => pop_all_but_one_plus_one(br, fp),
		30 => pop_all_but_one_plus_n(br, fp),
		31 => pop_all_but_one_plus_n_pack3_bits(br, fp),
		32 => pop_all_but_one_plus_n_pack6_bits(br, fp),
		33 => pop_n_plus_one(br, fp),
		34 => pop_n_plus_n(br, fp),
		35 => pop_n_and_non_topographical(br, fp),
		36 => non_topo_complex(br, fp),
		37 => non_topo_penultimate_plus_one(br, fp),
		38 => non_topo_complex_pack4_bits(br, fp),
		39 => {} // STOP — handled by caller
		_ => return Err("PathError.GenericPathOpError"),
	}
	Ok(())
}

// ─── Huffman LUT + parsePaths ────────────────────────────────────────────────
// Unused until Phase 5 wires `parse_paths` into the entity decoder. Kept here
// so the Huffman tables compile once and stay co-located with the opcode table.
#[allow(dead_code)]
const STOP_READING_SYMBOL: u32 = 39;
#[allow(dead_code)]
const HUFFMAN_CODE_MAXLEN: u32 = 17;
#[allow(dead_code)]
const LUT_SIZE: usize = 1 << HUFFMAN_CODE_MAXLEN; // 131_072

/// JS frequency table from `fieldPaths.ts:60-63`. Zero weights are treated as 1
/// so every symbol stays in the tree even when never observed in capture data.
#[allow(dead_code)]
const FIELDPATH_WEIGHTS: [u32; 40] = [
	36271, 10334, 1375, 646, 4128, 35, 3, 521, 2942, 560, 471, 10530, 251, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 310,
	2, 0, 1837, 149, 300, 634, 0, 0, 1, 76, 271, 99, 25474,
];

#[allow(dead_code)]
#[derive(Clone)]
struct TreeNode {
	value: u32,
	weight: u32,
	left: Option<Box<TreeNode>>,
	right: Option<Box<TreeNode>>,
	leaf: bool,
}

/// Builds the Huffman tree using the same comparator JS uses: smaller weight
/// first; on ties, larger `value` first. Determinism is required because the
/// JS LUT (and therefore the wire-format encoder) depends on this exact order.
#[allow(dead_code)]
fn build_huffman_tree() -> TreeNode {
	let mut nodes: Vec<TreeNode> = FIELDPATH_WEIGHTS
		.iter()
		.enumerate()
		.map(|(value, &w)| TreeNode {
			value: value as u32,
			weight: if w == 0 { 1 } else { w },
			left: None,
			right: None,
			leaf: true,
		})
		.collect();
	let mut n = nodes.len() as u32;

	while nodes.len() > 1 {
		// sort: smaller weight first; on tie, larger value first
		nodes.sort_by(|a, b| {
			if a.weight == b.weight {
				b.value.cmp(&a.value)
			} else {
				a.weight.cmp(&b.weight)
			}
		});
		let left = nodes.remove(0);
		let right = nodes.remove(0);
		let parent = TreeNode {
			value: n,
			weight: left.weight + right.weight,
			left: Some(Box::new(left)),
			right: Some(Box::new(right)),
			leaf: false,
		};
		nodes.push(parent);
		n += 1;
	}
	nodes.pop().unwrap()
}

/// Mirrors the JS LUT (`huffmanSymbol[idx]`, `huffmanLength[idx]`). For each
/// of 2^17 possible 17-bit prefixes, stores the symbol that prefix decodes
/// to and its actual bit length.
#[allow(dead_code)]
struct HuffmanLut {
	symbol: Vec<u8>,
	length: Vec<u8>,
}

#[allow(dead_code)]
fn build_lut(node: &TreeNode, code: u32, depth: u32, lut: &mut HuffmanLut) {
	if node.leaf {
		let count = 1u32 << (HUFFMAN_CODE_MAXLEN - depth);
		for i in 0..count {
			let idx = (code | (i << depth)) as usize;
			lut.symbol[idx] = node.value as u8;
			lut.length[idx] = depth as u8;
		}
		return;
	}
	build_lut(node.left.as_ref().unwrap(), code, depth + 1, lut);
	build_lut(node.right.as_ref().unwrap(), code | (1 << depth), depth + 1, lut);
}

/// Lazy-built singleton. Built once on first parse; ~256KB total.
#[allow(dead_code)]
static HUFFMAN_LUT: std::sync::OnceLock<HuffmanLut> = std::sync::OnceLock::new();

#[allow(dead_code)]
fn lut() -> &'static HuffmanLut {
	HUFFMAN_LUT.get_or_init(|| {
		let mut lut = HuffmanLut { symbol: vec![0u8; LUT_SIZE], length: vec![0u8; LUT_SIZE] };
		let tree = build_huffman_tree();
		build_lut(&tree, 0, 0, &mut lut);
		lut
	})
}

/// Decode a stream of field-path updates from `br`, writing each successive
/// path into `out`. Returns the number of paths produced (the number of
/// field updates that follow in the byte stream).
///
/// The JS counterpart writes through `EntityParser.writeFp(fp, idx)` to a
/// pre-allocated pool; here we mirror that by writing into a caller-owned
/// `&mut [FieldPath]`. Caller sizes the pool (8192 in the JS reference).
#[allow(dead_code)]
pub fn parse_paths(br: &mut BitBuffer, out: &mut [FieldPath]) -> usize {
	let lut = lut();
	let mut fp = FieldPath::new();
	let mut idx = 0;
	loop {
		let peeked = br.peek_ubits_with_log(HUFFMAN_CODE_MAXLEN) as usize;
		let symbol = lut.symbol[peeked] as u32;
		let code_len = lut.length[peeked] as u32;
		br.consume_peeked(code_len);

		if symbol == STOP_READING_SYMBOL {
			break;
		}
		// Out-of-range opcodes from a corrupted stream return Err in do_op;
		// JS throws there too. Surface as a panic to mirror semantics — the
		// caller's catch-RangeError fallback in parseSession.ts handles it.
		if let Err(e) = do_op(symbol, br, &mut fp) {
			panic!("{}", e);
		}

		if idx < out.len() {
			out[idx] = fp;
		}
		idx += 1;
	}
	idx
}

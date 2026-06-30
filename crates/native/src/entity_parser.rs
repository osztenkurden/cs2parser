//! Per-packet entity decoder. 1:1 port of `src/parser/entities/entityParser.ts`.
//!
//! Reads `CSVCMsg_PacketEntities.entity_data` bytes, walks each updated entity,
//! decodes its field-path stream + value stream, and writes the operations into
//! a `DecodeResult` for JS to apply to the entities array.

use crate::bitbuffer::BitBuffer;
use crate::classinfo::{Class, ClassInfo, Decoder, Field, SerializerN};
use crate::fieldpath::{do_op, FieldPath};
use crate::quantized_float::{decode_qfloat, QFF_ENCODE_ZERO, QFF_ROUNDDOWN, QFF_ROUNDUP};

const NSERIALBITS: u32 = 17;

// Mirrors `EntityTypeEnum` in JS.
const ENTITY_TYPE_PLAYER_CONTROLLER: u8 = 0;
const ENTITY_TYPE_RULES: u8 = 1;
const ENTITY_TYPE_PROJECTILE: u8 = 2;
const ENTITY_TYPE_TEAM: u8 = 3;
const ENTITY_TYPE_NORMAL: u8 = 4;
const ENTITY_TYPE_C4: u8 = 5;

fn entity_type(name: &str) -> u8 {
	match name {
		"CCSPlayerController" => ENTITY_TYPE_PLAYER_CONTROLLER,
		"CCSGameRulesProxy" => ENTITY_TYPE_RULES,
		"CTeam" => ENTITY_TYPE_TEAM,
		"CC4" => ENTITY_TYPE_C4,
		_ if name.contains("Projectile") || name == "CIncendiaryGrenade" => ENTITY_TYPE_PROJECTILE,
		_ => ENTITY_TYPE_NORMAL,
	}
}

// ─── DecodeResult struct-of-arrays ───────────────────────────────────────────
//
// Wire format documented in `lib.rs` next to the napi #[napi(object)] mirror.
// Ops byte stream:
//   CREATE: tag=1, entityId u32 LE, classId u32 LE, entityType u8,
//           classNameIdx u32 LE, updateCount u32 LE, updateCount × update_rec
//   UPDATE: tag=2, entityId u32 LE, updateCount u32 LE, updateCount × update_rec
//   DELETE: tag=3, entityId u32 LE
// update_rec: propId u32 LE, valueKind u8, valueIdx u32 LE
//
// valueKind:
//   0 bool  — f64_values[idx] is 0 or 1
//   1 i32   — f64_values[idx]
//   2 u32   — f64_values[idx]
//   3 f32   — f64_values[idx]
//   4 vec3  — f64_values[idx..idx+3]
//   5 u64   — bigint_values[idx] (as i64-bit-bag of u64)
//   6 str   — strings[idx]
//   7 blob  — blobs[idx]

pub const TAG_CREATE: u8 = 1;
pub const TAG_UPDATE: u8 = 2;
pub const TAG_DELETE: u8 = 3;

// Stage 4 lifecycle / frame-loop events. Each carries either a tick value or
// a blob index into `result.blobs[]` holding raw protobuf bytes that JS
// decodes via ts-proto.
pub const TAG_TICKSTART: u8 = 10;
pub const TAG_TICKEND: u8 = 11;
pub const TAG_HEADER: u8 = 12; // [blobIdx u32]
pub const TAG_SERVERINFO: u8 = 13; // [blobIdx u32]
pub const TAG_GAMEEVENTLIST: u8 = 14; // [blobIdx u32]
pub const TAG_GAMEEVENT: u8 = 15; // [blobIdx u32]
pub const TAG_PLAYERINFO: u8 = 16; // [blobIdx u32] — raw CMsgPlayerInfo bytes
pub const TAG_OPTIONAL_SVC: u8 = 22; // [cmdId u32][blobIdx u32]
pub const TAG_DEM_STOP: u8 = 24; // (no payload) — DEM_Stop marker reached
pub const TAG_DEBUG: u8 = 25; // [blobIdx u32] — utf8 string
pub const TAG_PROGRESS: u8 = 26; // [u32 fraction-as-fixed-point-x-1000]

pub const VK_BOOL: u8 = 0;
pub const VK_I32: u8 = 1;
pub const VK_U32: u8 = 2;
pub const VK_F32: u8 = 3;
pub const VK_VEC3: u8 = 4;
pub const VK_U64: u8 = 5;
pub const VK_STRING: u8 = 6;
pub const VK_BLOB: u8 = 7;

/// Per-property decoded value. Stored in `EntityRecord.properties` so the
/// JS getter API can read them on demand (Stage 1+).
#[derive(Clone, Debug)]
pub enum Value {
	Bool(bool),
	I32(i32),
	U32(u32),
	F32(f32),
	Vec3([f64; 3]),
	U64(u64),
	String(String),
	Blob(Vec<u8>),
}

/// A vector/array entity field reconstructed from per-element wire writes.
/// Mirrors the JS container storage model (`writeToContainer`/`resizeContainer`
/// in `entityParser.ts`). Keyed by the container's full name (`containerKey`).
#[derive(Clone, Debug)]
pub enum Container {
	/// Primitive container surfaced as a typed array (`element_kind`), or a plain
	/// numeric/bigint/string/vec3 array when `element_kind` is `None`. Holes are
	/// `None`.
	Scalar { element_kind: Option<crate::classinfo::ElementKind>, data: Vec<Option<Value>> },
	/// Vector-of-serializer: each element is a struct of sub-field name → value.
	Struct { data: Vec<Option<std::collections::HashMap<String, Value>>> },
}

/// Live entity record. Scalar properties are keyed by the global `prop_id`
/// assigned at classInfo build time. Container (vector/array) fields are keyed
/// by their fully-qualified `containerKey` name.
#[derive(Debug)]
pub struct EntityRecord {
	pub class_id: u32,
	pub entity_type: u8,
	pub class_name: String,
	pub properties: std::collections::HashMap<u32, Value>,
	pub containers: std::collections::HashMap<String, Container>,
}

#[derive(Default)]
pub struct DecodeResult {
	pub ops: Vec<u8>,
	pub op_count: u32,
	pub f64_values: Vec<f64>,
	pub bigint_values: Vec<i64>,
	pub strings: Vec<String>,
	pub blobs: Vec<Vec<u8>>,
	pub class_names: Vec<String>,
	class_name_idx: std::collections::HashMap<String, u32>,
	/// Running counter of `update_rec` entries appended within the current op
	/// window. Used to patch the placeholder update-count slot after the
	/// records are written. Reset at the start of each op (begin_create /
	/// begin_update).
	pub transient_rec_count: u32,
}

impl DecodeResult {
	pub fn reset(&mut self) {
		self.ops.clear();
		self.op_count = 0;
		self.f64_values.clear();
		self.bigint_values.clear();
		self.strings.clear();
		self.blobs.clear();
		self.class_names.clear();
		self.class_name_idx.clear();
	}

	fn intern_class(&mut self, name: &str) -> u32 {
		if let Some(&i) = self.class_name_idx.get(name) {
			return i;
		}
		let i = self.class_names.len() as u32;
		self.class_names.push(name.to_string());
		self.class_name_idx.insert(name.to_string(), i);
		i
	}

	fn push_u8(&mut self, b: u8) {
		self.ops.push(b);
	}
	fn push_u32(&mut self, v: u32) {
		self.ops.extend_from_slice(&v.to_le_bytes());
	}
	fn patch_u32(&mut self, at: usize, v: u32) {
		let bytes = v.to_le_bytes();
		self.ops[at] = bytes[0];
		self.ops[at + 1] = bytes[1];
		self.ops[at + 2] = bytes[2];
		self.ops[at + 3] = bytes[3];
	}

	fn push_delete(&mut self, entity_id: u32) {
		self.push_u8(TAG_DELETE);
		self.push_u32(entity_id);
		self.op_count += 1;
	}

	pub fn push_tick(&mut self, tag: u8, tick: i32) {
		self.push_u8(tag);
		self.push_u32(tick as u32);
		self.op_count += 1;
	}

	pub fn push_blob_event(&mut self, tag: u8, bytes: Vec<u8>) {
		let idx = self.alloc_blob(bytes);
		self.push_u8(tag);
		self.push_u32(idx);
		self.op_count += 1;
	}

	pub fn push_optional_svc(&mut self, cmd_id: u32, bytes: Vec<u8>) {
		let idx = self.alloc_blob(bytes);
		self.push_u8(TAG_OPTIONAL_SVC);
		self.push_u32(cmd_id);
		self.push_u32(idx);
		self.op_count += 1;
	}

	pub fn push_simple(&mut self, tag: u8) {
		self.push_u8(tag);
		self.op_count += 1;
	}

	/// v2: lifecycle-only create. No nested update records — properties are
	/// already in the entity's Rust-resident HashMap by the time JS receives
	/// this op, so the 'entitycreated' listener can read them via getters.
	fn begin_create_lifecycle(
		&mut self,
		entity_id: u32,
		class_id: u32,
		entity_type: u8,
		class_name: &str,
	) {
		let name_idx = self.intern_class(class_name);
		self.push_u8(TAG_CREATE);
		self.push_u32(entity_id);
		self.push_u32(class_id);
		self.push_u8(entity_type);
		self.push_u32(name_idx);
		self.op_count += 1;
	}

	fn push_update_rec(&mut self, prop_id: u32, kind: u8, idx: u32) {
		self.push_u32(prop_id);
		self.push_u8(kind);
		self.push_u32(idx);
	}

	fn alloc_f64(&mut self, v: f64) -> u32 {
		let idx = self.f64_values.len() as u32;
		self.f64_values.push(v);
		idx
	}
	fn alloc_vec3(&mut self, v: [f64; 3]) -> u32 {
		let idx = self.f64_values.len() as u32;
		self.f64_values.extend_from_slice(&v);
		idx
	}
	fn alloc_bigint(&mut self, v: u64) -> u32 {
		let idx = self.bigint_values.len() as u32;
		self.bigint_values.push(v as i64);
		idx
	}
	fn alloc_string(&mut self, s: String) -> u32 {
		let idx = self.strings.len() as u32;
		self.strings.push(s);
		idx
	}
	fn alloc_blob(&mut self, b: Vec<u8>) -> u32 {
		let idx = self.blobs.len() as u32;
		self.blobs.push(b);
		idx
	}

	/// Encode a `Value` into the side-buffers, returning `(kind, idx)` for the
	/// matching `update_rec`. Used by `decode_field` after Stage 1: the value
	/// is already decoded + stored in the entity record, and we just need to
	/// stream it into the result for the transitional JS apply path.
	fn push_value(&mut self, v: &Value) -> (u8, u32) {
		match v {
			Value::Bool(b) => (VK_BOOL, self.alloc_f64(if *b { 1.0 } else { 0.0 })),
			Value::I32(n) => (VK_I32, self.alloc_f64(*n as f64)),
			Value::U32(n) => (VK_U32, self.alloc_f64(*n as f64)),
			Value::F32(f) => (VK_F32, self.alloc_f64(*f as f64)),
			Value::Vec3(v) => (VK_VEC3, self.alloc_vec3(*v)),
			Value::U64(u) => (VK_U64, self.alloc_bigint(*u)),
			Value::String(s) => (VK_STRING, self.alloc_string(s.clone())),
			Value::Blob(b) => (VK_BLOB, self.alloc_blob(b.clone())),
		}
	}
}

// ─── findFieldAndDecode ──────────────────────────────────────────────────────

fn get_inner_ext<'a>(field: &'a Field, index: usize) -> &'a Field {
	match field {
		Field::Array { field_enum, .. } | Field::Vector { field_enum, .. } => field_enum,
		Field::Serializer { serializer } | Field::Pointer { serializer, .. } => {
			serializer.fields[index].as_ref().expect("ILLEGAL PATH")
		}
		Field::Value { .. } | Field::None => panic!("ILLEGAL PATH"),
	}
}

#[derive(Clone, Copy)]
struct FieldInfo {
	decoder: Decoder,
	prop_id: u32,
	has_info: bool,
	/// Element index when the path entered the outermost container, else -1.
	array_index: i32,
	/// True when the path stopped AT a vector field (resize message).
	is_resize: bool,
}

/// 1:1 port of the JS `findFieldAndDecode` (post-`e8ac92c`). Walks the field
/// path, capturing the outermost array/vector element index, and resolves the
/// leaf to a decoder + prop_id (or detects a vector resize message).
fn find_field_and_decode(fp: &FieldPath, ser: &SerializerN) -> FieldInfo {
	let f = ser.fields[fp.path[0] as usize].as_ref().expect("Noo field");

	// Fast path: depth-0 Value field (most common). Must NOT take this for a
	// depth-0 Vector (that's a resize) or Array.
	if fp.last == 0 {
		if let Field::Value { decoder, prop_id, .. } = f {
			return FieldInfo { decoder: *decoder, prop_id: *prop_id, has_info: true, array_index: -1, is_resize: false };
		}
	}

	// Traverse to leaf, capturing the outermost container element index.
	let mut field = f;
	let mut array_index: i32 = -1;
	for depth in 1..=fp.last as usize {
		if matches!(field, Field::Vector { .. } | Field::Array { .. }) && array_index == -1 {
			array_index = fp.path[depth] as i32;
		}
		field = get_inner_ext(field, fp.path[depth] as usize);
	}

	match field {
		Field::Value { decoder, prop_id, .. } => {
			FieldInfo { decoder: *decoder, prop_id: *prop_id, has_info: true, array_index, is_resize: false }
		}
		Field::Vector { field_enum, .. } => {
			// Path stopped AT the vector → resize message (UVarInt32 new length).
			// prop_id points at the inner element so we know which container to resize.
			let inner = field_enum.as_ref();
			if let Field::Value { prop_id, .. } = inner {
				FieldInfo {
					decoder: Decoder::Unsigned,
					prop_id: *prop_id,
					has_info: true,
					array_index: -1,
					is_resize: true,
				}
			} else {
				FieldInfo { decoder: Decoder::Unsigned, prop_id: 0, has_info: false, array_index: -1, is_resize: false }
			}
		}
		Field::Pointer { decoder, .. } => {
			FieldInfo { decoder: *decoder, prop_id: 0, has_info: false, array_index: -1, is_resize: false }
		}
		Field::Array { .. } | Field::Serializer { .. } | Field::None => {
			FieldInfo { decoder: Decoder::Unsigned, prop_id: 0, has_info: false, array_index: -1, is_resize: false }
		}
	}
}

// ─── Per-field decode ────────────────────────────────────────────────────────

/// Decodes the next field from the bit stream and returns its `Value`.
/// The bit stream MUST advance regardless of whether the value is wanted —
/// skipping a field is a protocol-level error.
fn decode_value(
	br: &mut BitBuffer,
	decoder: Decoder,
	qf_table: &[crate::quantized_float::QuantizedFloat],
) -> Value {
	use Decoder::*;
	match decoder {
		QuantizedFloat(qi) => Value::F32(decode_qfloat(br, &qf_table[qi as usize])),
		VectorNormal => Value::Vec3(br.decode_normal_vec()),
		VectorNoScale => Value::Vec3(br.decode_vector_noscale()),
		VectorFloatCoord => Value::Vec3(br.decode_vector_float_coord()),
		Boolean | Component => Value::Bool(br.read_boolean()),
		NoScale => Value::F32(br.read_float32_le()),
		Signed => Value::I32(br.read_varint32()),
		Unsigned | Base | CentityHandle => Value::U32(br.read_uvarint32()),
		FloatSimulationTime => Value::F32(((br.read_uvarint32() as f64) * (1.0 / 30.0)) as f32),
		FloatCoord => Value::F32(br.read_bit_coord()),
		Fixed64 => Value::U64(br.decode_uint64()),
		Unsigned64 => Value::U64(br.read_uvarint64()),
		Qangle3 => Value::Vec3(br.decode_qangle_all3()),
		QanglePitchYaw => Value::Vec3(br.decode_qangle_pitch_yaw()),
		QangleVar => Value::Vec3(br.decode_qangle_variant()),
		QanglePres => Value::Vec3(br.decode_qangle_variant_pres()),
		String => Value::String(br.read_string()),
		Ammo => Value::U32(br.decode_ammo()),
		GameModeRules => Value::U32(br.read_ubits(7)),
		BinaryBlock => {
			let len = br.read_uvarint32() as usize;
			let mut out = vec![0u8; len];
			br.read_bytes_into(&mut out);
			Value::Blob(out)
		}
	}
}


// ─── EntityState (per-decoder live state) ────────────────────────────────────

pub struct EntityState {
	/// Full live record per entity id. `None` = the entity isn't tracked for
	/// property storage (deleted, never created, or filtered by
	/// `only_game_rules`). Even when `entities[id]` is `None`, `class_ids[id]`
	/// may be `Some` — see `class_ids`.
	pub entities: Vec<Option<EntityRecord>>,
	/// Per-entity class id, tracked independently of `entities`. Required
	/// because subsequent updates to an entity need its class serializer to
	/// walk the wire stream, even when the entity itself isn't being stored
	/// (e.g. non-Rules entities in `only_game_rules` mode). Without this,
	/// skipped updates would not consume their bit-stream bytes and desync the
	/// decoder for every entity that follows in the same packet.
	pub class_ids: Vec<Option<u32>>,
	/// Pre-allocated FieldPath pool sized to the worst-case packet (JS uses 8192).
	pub paths: Vec<FieldPath>,
	/// Baselines indexed by classId. Populated by `set_baseline` (JS forwards
	/// these from string-table parsing).
	pub baselines: std::collections::HashMap<u32, Vec<u8>>,
	pub only_game_rules: bool,
}

impl EntityState {
	pub fn new() -> Self {
		Self {
			entities: Vec::new(),
			class_ids: Vec::new(),
			paths: vec![FieldPath::new(); 8192],
			baselines: Default::default(),
			only_game_rules: false,
		}
	}

	pub fn reset(&mut self) {
		self.entities.clear();
		self.class_ids.clear();
		self.baselines.clear();
	}

	fn ensure_capacity(&mut self, id: u32) {
		if (id as usize) >= self.entities.len() {
			self.entities.resize_with((id as usize) + 1, || None);
			self.class_ids.resize((id as usize) + 1, None);
		}
	}

	pub fn parse_entity_packet(
		&mut self,
		entity_data: &[u8],
		updated_entries: u32,
		has_pvs_vis_bits: u32,
		class_info: &ClassInfo,
		result: &mut DecodeResult,
	) {
		let mut br = BitBuffer::new(entity_data.to_vec());
		let mut entity_id: i64 = -1;

		for _ in 0..updated_entries {
			entity_id += 1 + br.read_ubit_var() as i64;
			let ent_id_u32 = entity_id as u32;
			let update_type = br.read_ubits(2);

			if (update_type & 0b01) != 0 {
				if update_type == 0b11 {
					self.ensure_capacity(ent_id_u32);
					let was_stored = self.entities[ent_id_u32 as usize].is_some();
					self.entities[ent_id_u32 as usize] = None;
					self.class_ids[ent_id_u32 as usize] = None;
					if was_stored {
						result.push_delete(ent_id_u32);
					}
				}
			} else if update_type == 0b10 {
				self.create_entity(&mut br, ent_id_u32, class_info, result);
			} else {
				if has_pvs_vis_bits > 0 {
					let delta_cmd = br.read_ubits(2);
					if (delta_cmd & 0x1) == 1 {
						continue;
					}
				}
				self.update_entity(&mut br, ent_id_u32, class_info, result);
			}
		}
	}

	fn create_entity(&mut self, br: &mut BitBuffer, entity_id: u32, class_info: &ClassInfo, result: &mut DecodeResult) {
		let class_id = br.read_ubits(8);
		let _serial = br.read_ubits(NSERIALBITS);
		let _ = br.read_uvarint32();

		let Some(cls) = class_info.classes.get(&class_id) else {
			// Unknown class — skip silently. JS would throw, but we'd rather
			// keep the decoder rolling and let JS report.
			return;
		};
		let etype = entity_type(&cls.name);
		self.ensure_capacity(entity_id);
		self.class_ids[entity_id as usize] = Some(class_id);

		// `onlyGameRules` mode: track only Rules-type entities. Non-rules entities
		// still parse their wire bytes (mandatory for byte-stream alignment) but
		// we don't allocate an EntityRecord for them.
		let is_rules = etype == ENTITY_TYPE_RULES;
		let store = !self.only_game_rules || is_rules;

		if store {
			self.entities[entity_id as usize] = Some(EntityRecord {
				class_id,
				entity_type: etype,
				class_name: cls.name.clone(),
				properties: std::collections::HashMap::new(),
				containers: std::collections::HashMap::new(),
			});
		} else {
			self.entities[entity_id as usize] = None;
		}

		// v2: emit only the create lifecycle event — properties aren't shipped
		// in the result stream anymore (Rust is the source of truth, JS reads
		// via getters). Walk both baseline + delta so the entity's HashMap is
		// populated before the JS-side 'entitycreated' listener fires.
		if store {
			result.begin_create_lifecycle(entity_id, class_id, etype, &cls.name);
		}
		if let Some(baseline) = self.baselines.get(&class_id).cloned() {
			let mut bl_reader = BitBuffer::new(baseline);
			self.run_path_stream(&mut bl_reader, entity_id, class_id, class_info, result, store);
		}
		self.run_path_stream(br, entity_id, class_id, class_info, result, store);
	}

	fn update_entity(&mut self, br: &mut BitBuffer, entity_id: u32, class_info: &ClassInfo, _result: &mut DecodeResult) {
		// v2: updates write to Rust-resident state only. The JS apply path
		// no longer walks per-property records — callers read on demand via
		// the getter API. We still need to consume the wire bytes correctly,
		// so `store` still gates HashMap writes but no result ops are emitted.
		let class_id = match self.class_ids.get(entity_id as usize).copied().flatten() {
			Some(c) => c,
			None => return,
		};
		let is_rules = class_info.class_is_rules.get(&class_id).copied().unwrap_or(false);
		let store = !self.only_game_rules || is_rules;

		self.run_path_stream(br, entity_id, class_id, class_info, _result, store);
	}

	/// Decode one path-stream from `br` against `entity_id`'s class serializer.
	/// `store=false` skips the entity-record + result writes but still advances
	/// the bit stream (mandatory for stream alignment).
	fn run_path_stream(
		&mut self,
		br: &mut BitBuffer,
		entity_id: u32,
		class_id: u32,
		class_info: &ClassInfo,
		result: &mut DecodeResult,
		store: bool,
	) {
		let cls = &class_info.classes[&class_id];
		let n_updates = crate::fieldpath::parse_paths(br, &mut self.paths);
		let class_prop_set = &class_info.prop_id_to_name;
		let qf_table = &class_info.qf_table;

		for i in 0..n_updates {
			let path = self.paths[i];
			let info = find_field_and_decode(&path, &cls.serializer);
			let value = decode_value(br, info.decoder, qf_table);

			if !store {
				continue;
			}
			// Filter: only properties registered in the global propIdToName map
			// (i.e. fields on "interesting" serializers) are stored / emitted.
			// Other reads advance the bit stream but produce no visible state.
			let prop_known = info.has_info && info.prop_id != 0 && class_prop_set.contains_key(&info.prop_id);
			if !prop_known {
				continue;
			}

			// v2: write to Rust-resident state only. JS reads via getters
			// instead of walking a result-side record stream.
			let pinfo = class_info.prop_id_to_info.get(&info.prop_id);
			if let Some(ent) = self.entities[entity_id as usize].as_mut() {
				apply_prop_update(ent, pinfo, info.prop_id, info.array_index, info.is_resize, value);
			}
			let _ = result; // suppress unused param
		}
	}
}

/// Containers never legitimately hold more than a few thousand elements; a
/// length/index beyond this is a wire desync producing a bogus value. Drop the
/// write rather than attempt a multi-GB allocation that aborts the process.
const CONTAINER_SANITY_CAP: usize = 16_000_000;

/// Value used for the dynamic-vector resize message — the new length.
fn value_as_len(v: &Value) -> usize {
	match v {
		Value::U32(n) => *n as usize,
		Value::I32(n) => (*n).max(0) as usize,
		Value::U64(n) => *n as usize,
		_ => 0,
	}
}

/// Apply one decoded field write to an entity record. Dispatches resize /
/// container-element / scalar exactly like the JS `applyPropUpdate`.
fn apply_prop_update(
	ent: &mut EntityRecord,
	info: Option<&crate::classinfo::PropInfo>,
	prop_id: u32,
	array_index: i32,
	is_resize: bool,
	value: Value,
) {
	match info {
		Some(pi) if is_resize => {
			let key = pi.container_key.clone().unwrap_or_else(|| pi.name.clone());
			resize_container(ent, &key, pi, value_as_len(&value));
		}
		Some(pi) if pi.container_key.is_some() && array_index >= 0 => {
			write_to_container(ent, pi, array_index as usize, value);
		}
		_ => {
			ent.properties.insert(prop_id, value);
		}
	}
}

fn write_to_container(ent: &mut EntityRecord, pi: &crate::classinfo::PropInfo, idx: usize, value: Value) {
	let key = pi.container_key.as_ref().expect("container write without containerKey");
	if idx >= CONTAINER_SANITY_CAP {
		eprintln!(
			"[cs2parser] DROP oversized container write: name={} idx={} sub={:?} kind={:?}",
			pi.name, idx, pi.sub_key, pi.element_kind
		);
		return;
	}
	if let Some(sub) = pi.sub_key.as_ref() {
		let c = ent
			.containers
			.entry(key.clone())
			.or_insert_with(|| Container::Struct { data: Vec::new() });
		if let Container::Struct { data } = c {
			if idx >= data.len() {
				data.resize_with(idx + 1, || None);
			}
			let elem = data[idx].get_or_insert_with(std::collections::HashMap::new);
			elem.insert(sub.clone(), value);
		}
	} else {
		let kind = pi.element_kind;
		let c = ent
			.containers
			.entry(key.clone())
			.or_insert_with(|| Container::Scalar { element_kind: kind, data: Vec::new() });
		if let Container::Scalar { data, .. } = c {
			if idx >= data.len() {
				data.resize(idx + 1, None);
			}
			data[idx] = Some(value);
		}
	}
}

fn resize_container(ent: &mut EntityRecord, key: &str, pi: &crate::classinfo::PropInfo, new_len: usize) {
	if new_len >= CONTAINER_SANITY_CAP {
		eprintln!(
			"[cs2parser] DROP oversized container resize: name={} key={} new_len={} sub={:?} kind={:?}",
			pi.name, key, new_len, pi.sub_key, pi.element_kind
		);
		return;
	}
	match ent.containers.get_mut(key) {
		Some(Container::Scalar { data, .. }) => data.resize(new_len, None),
		Some(Container::Struct { data }) => data.resize_with(new_len, || None),
		None => {
			let c = if pi.sub_key.is_some() {
				Container::Struct { data: (0..new_len).map(|_| None).collect() }
			} else {
				Container::Scalar { element_kind: pi.element_kind, data: vec![None; new_len] }
			};
			ent.containers.insert(key.to_string(), c);
		}
	}
}

// Suppress the unused-import for QFF_* used by decode_qfloat indirectly.
const _: u32 = QFF_ROUNDDOWN + QFF_ROUNDUP + QFF_ENCODE_ZERO;

//! Class-info & decoder discovery. 1:1 port of `src/parser/entities/classInfo.ts`
//! + `src/parser/entities/constructorFields.ts`.
//!
//! Runs once per demo when DEM_SendTables + DEM_ClassInfo arrive:
//! 1. Decode the inner CSVCMsg_FlattenedSerializer (already done in JS, bytes
//!    passed in).
//! 2. Build a `ConstructorField` per wire-format field (type name parse +
//!    decoder selection + per-quantized-float registration into qfMapper).
//! 3. Build a `SerializerN` field tree per per-class serializer.
//! 4. For "interesting" classes (player / weapon / team / rules / projectile),
//!    walk the tree and assign sequential `prop_id`s into `propIdToName` /
//!    `propIdToDecoder`.
//! 5. Map class IDs → built serializer trees.

use crate::proto::{CDemoClassInfo, CsvcMsgFlattenedSerializer, ProtoFlattenedSerializerFieldT};
use crate::quantized_float::{get_quantized_float, QuantizedFloat};
use prost::Message;
use std::collections::HashMap;

// ─── Decoder enum (1:1 with constructorFields.ts D_* IDs) ────────────────────

#[derive(Clone, Copy, Debug, PartialEq)]
pub enum Decoder {
	Boolean,
	Signed,
	Unsigned,
	String,
	NoScale,
	Component,
	FloatCoord,
	FloatSimulationTime,
	Fixed64,
	Unsigned64,
	CentityHandle,
	Base,
	QanglePitchYaw,
	Qangle3,
	QangleVar,
	Ammo,
	QanglePres,
	GameModeRules,
	BinaryBlock,
	VectorNormal,
	VectorNoScale,
	VectorFloatCoord,
	/// Index into the per-decoder `qf_table`.
	QuantizedFloat(u32),
}

#[derive(Clone, Copy, Debug, PartialEq)]
pub enum FieldCategory {
	Pointer,
	Vector,
	Array,
	Value,
}

/// Typed-array element kind for primitive container fields. Mirrors the JS
/// `typedArrayCtorMap` in `constructorFields.ts`. `None` (not in the map) means
/// the container is a plain JS array of decoded values.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum ElementKind {
	U8,
	I8,
	U16,
	I16,
	U32,
	I32,
	F32,
	/// `ResourceId_t` — decoded as bigint, surfaced as `BigUint64Array`.
	U64Big,
}

impl ElementKind {
	/// The matching JS typed-array constructor name (for codegen).
	pub fn ctor_name(self) -> &'static str {
		match self {
			ElementKind::U8 => "Uint8Array",
			ElementKind::I8 => "Int8Array",
			ElementKind::U16 => "Uint16Array",
			ElementKind::I16 => "Int16Array",
			ElementKind::U32 => "Uint32Array",
			ElementKind::I32 => "Int32Array",
			ElementKind::F32 => "Float32Array",
			ElementKind::U64Big => "BigUint64Array",
		}
	}
}

/// 1:1 with the JS `typedArrayCtorMap`.
fn typed_array_kind(base_type: Option<&str>) -> Option<ElementKind> {
	Some(match base_type? {
		"uint8" => ElementKind::U8,
		"int8" => ElementKind::I8,
		"uint16" => ElementKind::U16,
		"int16" => ElementKind::I16,
		"uint32" => ElementKind::U32,
		"int32" => ElementKind::I32,
		"float32" => ElementKind::F32,
		"ResourceId_t" => ElementKind::U64Big,
		_ => return None,
	})
}

/// Per-prop_id container/scalar metadata, mirror of the JS `PropInfo`
/// (`constructorFields.ts`). Built during `traverse_fields`.
#[derive(Clone, Debug, Default)]
pub struct PropInfo {
	/// Fully-qualified name. For container element/sub-field props this is the
	/// container's own path (`serializer.varName`), not the inner value's name.
	pub name: String,
	/// Present iff this prop is a container element / resize target / sub-field.
	pub container_key: Option<String>,
	/// Present iff vector-of-serializer: the sub-field name within each element.
	pub sub_key: Option<String>,
	/// Present iff a primitive container with a typed-array representation.
	pub element_kind: Option<ElementKind>,
	/// Present iff a fixed-size `T[N]` array (length N). `None` for dynamic vectors.
	pub fixed_length: Option<u32>,
	/// Codegen hint — the element base type name.
	pub element_ts_hint: Option<String>,
}

// ─── FieldType (parsed from var_type string) ─────────────────────────────────

#[derive(Clone, Debug)]
pub struct FieldType {
	pub base_type: String,
	pub generic_type: Option<Box<FieldType>>,
	pub pointer: bool,
	pub count: Option<u32>,
	pub element_type: Option<Box<FieldType>>,
}

fn is_pointer_from_name(name: &str) -> bool {
	matches!(
		name,
		"CBodyComponent" | "CLightComponent" | "CPhysicsComponent" | "CRenderComponent" | "CPlayerLocalData"
	)
}

fn get_base_field_type(base_name: &str, count: Option<u32>) -> FieldType {
	let is_pointer = base_name.contains('*') || is_pointer_from_name(base_name);
	let base_name_first = base_name.split('[').next().unwrap_or(base_name).to_string();

	let el_type = if count.is_some() {
		Some(Box::new(get_base_field_type(&base_name_first, None)))
	} else {
		None
	};

	FieldType {
		base_type: base_name_first,
		generic_type: None,
		pointer: is_pointer,
		count,
		element_type: el_type,
	}
}

fn clear_name(name: &str) -> String {
	let first_lt = name.split("< ").next().unwrap_or(name);
	let first_gt = first_lt.split(" >").next().unwrap_or(first_lt);
	first_gt.to_string()
}

pub fn find_field_type(name: &str) -> FieldType {
	let mut split_names: Vec<&str> = name.split("< ").collect();
	let base_name = split_names.remove(0);

	let bracket_pos = name.find('[');
	let count = bracket_pos.and_then(|i| {
		let rest = &name[i + 1..];
		let close = rest.find(']')?;
		rest[..close].parse::<u32>().ok()
	});

	let mut ft = get_base_field_type(base_name, count);

	// Walk the generic chain. Rust value semantics force us to navigate via
	// raw pointers to mutate the last node; JS used a mutable reference chain.
	if !split_names.is_empty() {
		let mut current: *mut FieldType = &mut ft;
		for generic in split_names {
			let base_generic = clear_name(generic);
			let generic_type = get_base_field_type(&base_generic, None);
			unsafe {
				(*current).generic_type = Some(Box::new(generic_type));
				current = (*current).generic_type.as_deref_mut().unwrap();
			}
		}
	}
	ft
}

// ─── Decoder selection ───────────────────────────────────────────────────────

/// Static (compile-time) decoder lookups by base type name. Maps the JS
/// `decoderMap` literal verbatim.
fn lookup_decoder_map(base_type: &str) -> Option<Decoder> {
	use Decoder::*;
	Some(match base_type {
		"bool" => Boolean,
		"char" => String,
		"int16" | "int32" | "int64" | "int8" => Signed,
		"uint16" | "uint32" | "uint8" | "color32" => Unsigned,
		"GameTime_t" => NoScale,
		"CBodyComponent" | "CPhysicsComponent" | "CRenderComponent" => Component,
		"CGameSceneNodeHandle" => Unsigned,
		"Color" => Unsigned,
		"CGlobalSymbol" => String,
		"CUtlBinaryBlock" => BinaryBlock,
		"CUtlString" => String,
		"CUtlStringToken" => Unsigned,
		"CUtlSymbolLarge" => String,
		"Quaternion" => NoScale,
		"CTransform" => NoScale,
		"HSequence"
		| "AttachmentHandle_t"
		| "CEntityIndex"
		| "MoveCollide_t"
		| "MoveType_t"
		| "RenderMode_t"
		| "RenderFx_t"
		| "SolidType_t"
		| "SurroundingBoundsType_t"
		| "ModelConfigHandle_t"
		| "NPC_STATE"
		| "StanceType_t"
		| "AbilityPathType_t"
		| "WeaponState_t"
		| "DoorState_t"
		| "RagdollBlendDirection"
		| "BeamType_t"
		| "BeamClipStyle_t"
		| "EntityDisolveType_t"
		| "tablet_skin_state_t"
		| "CStrongHandle"
		| "CSWeaponMode"
		| "ESurvivalSpawnTileState"
		| "SpawnStage_t"
		| "ESurvivalGameRuleDecision_t"
		| "RelativeDamagedDirection_t"
		| "CSPlayerState"
		| "MedalRank_t"
		| "CSPlayerBlockingUseAction_t"
		| "MoveMountingAmount_t"
		| "QuestProgress::Reason" => Unsigned64,
		_ => return None,
	})
}

pub struct ConstructorField {
	pub var_name: String,
	pub var_type: String,
	pub serializer_name: Option<String>,
	pub encoder: String,
	pub encode_flags: u32,
	pub bitcount: u32,
	pub low_value: f32,
	pub high_value: f32,
	pub field_type: FieldType,
	pub decoder: Decoder,
	pub category: FieldCategory,
	pub field_enum_type: Option<Field>,
}

impl ConstructorField {
	fn is_pointer(&self) -> bool {
		self.field_type.pointer || is_pointer_from_name(&self.field_type.base_type)
	}
	fn is_array(&self) -> bool {
		self.field_type.count.is_some() && self.field_type.base_type != "char"
	}
	fn is_vector(&self) -> bool {
		self.serializer_name.is_some()
			|| self.field_type.base_type == "CUtlVector"
			|| self.field_type.base_type == "CNetworkUtlVectorBase"
	}
}

fn find_category(field: &ConstructorField) -> FieldCategory {
	if field.is_pointer() {
		FieldCategory::Pointer
	} else if field.is_vector() {
		FieldCategory::Vector
	} else if field.is_array() {
		FieldCategory::Array
	} else {
		FieldCategory::Value
	}
}

/// Builds the field's runtime decoder, mutating `qf_table` for quantized-float
/// fields (the qf table is shared per decoder session).
fn find_float_decoder(field: &ConstructorField, qf_table: &mut Vec<QuantizedFloat>) -> Decoder {
	if field.var_name == "m_flSimulationTime" || field.var_name == "m_flAnimTime" {
		return Decoder::FloatSimulationTime;
	}
	if field.encoder == "coord" {
		return Decoder::FloatCoord;
	}
	if field.encoder == "m_flSimulationTime" {
		return Decoder::FloatSimulationTime;
	}
	if field.bitcount == 0 || field.bitcount >= 32 {
		return Decoder::NoScale;
	}
	let qf = get_quantized_float(
		field.bitcount,
		Some(field.encode_flags),
		Some(field.low_value),
		Some(field.high_value),
	);
	let idx = qf_table.len() as u32;
	qf_table.push(qf);
	Decoder::QuantizedFloat(idx)
}

fn find_vector_type(field: &ConstructorField, _n: u32, qf_table: &mut Vec<QuantizedFloat>) -> Decoder {
	if field.encoder == "normal" {
		return Decoder::VectorNormal;
	}
	let float_type = find_float_decoder(field, qf_table);
	match float_type {
		Decoder::NoScale => Decoder::VectorNoScale,
		Decoder::FloatCoord => Decoder::VectorFloatCoord,
		_ => Decoder::VectorNormal,
	}
}

fn find_uint_decoder(field: &ConstructorField) -> Decoder {
	if field.encoder == "fixed64" {
		Decoder::Fixed64
	} else {
		Decoder::Unsigned64
	}
}

fn find_qangle_decoder(field: &ConstructorField) -> Decoder {
	if field.encoder == "m_angEyeAngles" {
		return Decoder::QanglePitchYaw;
	}
	if field.bitcount != 0 {
		return Decoder::Qangle3;
	}
	Decoder::QangleVar
}

fn find_decoder(field: &ConstructorField, qf_table: &mut Vec<QuantizedFloat>) -> Decoder {
	use Decoder::*;
	if field.encoder == "qangle_precise" {
		return QanglePres;
	}
	if field.var_name == "m_PredFloatVariables" || field.var_name == "m_OwnerOnlyPredNetFloatVariables" {
		return NoScale;
	}
	if field.var_name == "m_OwnerOnlyPredNetVectorVariables" || field.var_name == "m_PredVectorVariables" {
		return VectorNoScale;
	}
	if field.var_name == "m_pGameModeRules" {
		return GameModeRules;
	}
	if field.var_name == "m_iClip1" {
		return Ammo;
	}
	// Container element decoder
	if let Some(generic) = field.field_type.generic_type.as_deref() {
		if field.field_type.base_type == "CNetworkUtlVectorBase"
			|| field.field_type.base_type == "CUtlVectorEmbeddedNetworkVar"
			|| field.field_type.base_type == "CUtlVector"
		{
			if let Some(d) = lookup_decoder_map(&generic.base_type) {
				return d;
			}
		}
	}
	if let Some(d) = lookup_decoder_map(&field.field_type.base_type) {
		return d;
	}
	match field.field_type.base_type.as_str() {
		"float32" => find_float_decoder(field, qf_table),
		"Vector" | "VectorWS" => find_vector_type(field, 3, qf_table),
		"Vector2D" => find_vector_type(field, 2, qf_table),
		"Vector4D" => find_vector_type(field, 4, qf_table),
		"uint64" => find_uint_decoder(field),
		"QAngle" => find_qangle_decoder(field),
		"CHandle" => Unsigned,
		"CNetworkedQuantizedFloat" => find_float_decoder(field, qf_table),
		"CStrongHandle" | "CEntityHandle" => find_uint_decoder(field),
		_ => Unsigned,
	}
}

// ─── Field tree ──────────────────────────────────────────────────────────────

#[derive(Clone, Debug)]
pub enum Field {
	None,
	Value { decoder: Decoder, name: String, prop_id: u32 },
	Array { field_enum: Box<Field>, length: u32, var_name: String, element_base_type: Option<String> },
	Vector { field_enum: Box<Field>, decoder: Decoder, var_name: String, element_base_type: Option<String> },
	Serializer { serializer: Box<SerializerN> },
	Pointer { serializer: Box<SerializerN>, decoder: Decoder },
}

#[derive(Clone, Debug)]
pub struct SerializerN {
	pub name: String,
	pub fields: Vec<Option<Field>>,
}

fn init_pointer_field(serializer: &SerializerN) -> Decoder {
	if serializer.name == "CCSGameModeRules" {
		Decoder::GameModeRules
	} else {
		Decoder::Boolean
	}
}

fn create_field(field: &ConstructorField, serializers: &HashMap<String, SerializerN>) -> Field {
	let mut element_field = match field.serializer_name.as_deref() {
		Some(sname) => {
			let serializer = serializers
				.get(sname)
				.cloned()
				.unwrap_or(SerializerN { name: sname.to_string(), fields: vec![] });
			if field.category == FieldCategory::Pointer {
				let decoder = init_pointer_field(&serializer);
				Field::Pointer { serializer: Box::new(serializer), decoder }
			} else {
				Field::Serializer { serializer: Box::new(serializer) }
			}
		}
		None => Field::Value { decoder: field.decoder, prop_id: 0, name: field.var_name.clone() },
	};

	if field.category == FieldCategory::Array {
		element_field = Field::Array {
			field_enum: Box::new(element_field),
			length: field.field_type.count.unwrap_or(0),
			var_name: field.var_name.clone(),
			// For fixed arrays the parsed FieldType keeps the per-element base name in `base_type`.
			element_base_type: Some(field.field_type.base_type.clone()),
		};
	} else if field.category == FieldCategory::Vector {
		element_field = Field::Vector {
			field_enum: Box::new(element_field),
			decoder: Decoder::Unsigned,
			var_name: field.var_name.clone(),
			element_base_type: field.field_type.generic_type.as_ref().map(|g| g.base_type.clone()),
		};
	}
	element_field
}

// ─── traverseFields: assign prop_ids ─────────────────────────────────────────

pub struct PropIdState {
	pub next: u32,
}

/// Accumulators threaded through `traverse_fields`.
pub struct TraverseMaps<'a> {
	pub prop_id_to_name: &'a mut HashMap<u32, String>,
	pub prop_id_to_decoder: &'a mut HashMap<u32, Decoder>,
	pub prop_id_to_info: &'a mut HashMap<u32, PropInfo>,
}

#[allow(clippy::too_many_arguments)]
fn emit_info(
	id: u32,
	name: &str,
	decoder: Decoder,
	maps: &mut TraverseMaps,
	container: Option<&str>,
	sub_key: Option<&str>,
	element_kind: Option<ElementKind>,
	fixed_length: Option<u32>,
	element_ts_hint: Option<&str>,
	container_override: Option<&str>,
) {
	maps.prop_id_to_name.insert(id, name.to_string());
	maps.prop_id_to_decoder.insert(id, decoder);
	let info = PropInfo {
		name: name.to_string(),
		container_key: container_override.or(container).map(str::to_string),
		sub_key: sub_key.map(str::to_string),
		element_kind,
		fixed_length,
		element_ts_hint: element_ts_hint.map(str::to_string),
	};
	maps.prop_id_to_info.insert(id, info);
}

/// 1:1 port of the JS `traverseFields` (post-`e8ac92c`). Assigns sequential
/// prop_ids and records each field's name / decoder / container metadata.
/// `container` carries the enclosing container's key when we're inside an
/// array/vector of serializers (outermost only — nested containers degrade).
pub fn traverse_fields(
	fields: &mut [Option<Field>],
	serializer_name: &str,
	maps: &mut TraverseMaps,
	state: &mut PropIdState,
	container: Option<&str>,
) {
	for field_opt in fields.iter_mut() {
		let Some(field) = field_opt else {
			continue;
		};
		match field {
			Field::Value { decoder, name, prop_id } => {
				let result = format!("{}.{}", serializer_name, name);
				let sub_key = if container.is_some() { Some(name.as_str()) } else { None };
				emit_info(state.next, &result, *decoder, maps, container, sub_key, None, None, None, None);
				*prop_id = state.next;
				state.next += 1;
			}
			Field::Serializer { serializer } | Field::Pointer { serializer, .. } => {
				let inner_name = format!("{}.{}", serializer_name, serializer.name);
				traverse_fields(&mut serializer.fields, &inner_name, maps, state, container);
			}
			Field::Array { field_enum, length, var_name, element_base_type } => {
				let container_name = format!("{}.{}", serializer_name, var_name);
				let element_kind = typed_array_kind(element_base_type.as_deref());
				let length = *length;
				let hint = element_base_type.clone();
				// Nested containers degrade to outermost-only.
				let next_container = container.map(str::to_string).unwrap_or_else(|| container_name.clone());
				match field_enum.as_mut() {
					Field::Value { decoder, prop_id, .. } => {
						emit_info(
							state.next,
							&container_name,
							*decoder,
							maps,
							container,
							None,
							element_kind,
							Some(length),
							hint.as_deref(),
							Some(&container_name),
						);
						*prop_id = state.next;
						state.next += 1;
					}
					Field::Serializer { serializer } => {
						traverse_fields(&mut serializer.fields, &container_name, maps, state, Some(&next_container));
					}
					_ => {}
				}
			}
			Field::Vector { field_enum, var_name, element_base_type, .. } => {
				let container_name = format!("{}.{}", serializer_name, var_name);
				let element_kind = typed_array_kind(element_base_type.as_deref());
				let hint = element_base_type.clone();
				let next_container = container.map(str::to_string).unwrap_or_else(|| container_name.clone());
				match field_enum.as_mut() {
					Field::Serializer { serializer } => {
						traverse_fields(&mut serializer.fields, &container_name, maps, state, Some(&next_container));
					}
					Field::Value { decoder, prop_id, .. } => {
						emit_info(
							state.next,
							&container_name,
							*decoder,
							maps,
							container,
							None,
							element_kind,
							None,
							hint.as_deref(),
							Some(&container_name),
						);
						*prop_id = state.next;
						state.next += 1;
					}
					_ => {}
				}
			}
			Field::None => {}
		}
	}
}

fn verify_serializer_name(name: &str) -> bool {
	let needles = [
		"Player",
		"Controller",
		"Team",
		"Weapon",
		"AK",
		"cell",
		"vec",
		"Projectile",
		"Knife",
		"CDEagle",
		"Rules",
		"C4",
		"Grenade",
		"Flash",
		"Molo",
		"Inc",
		"Infer",
	];
	needles.iter().any(|n| name.contains(n))
}

// ─── ClassInfo top-level ─────────────────────────────────────────────────────

pub struct ClassInfo {
	pub classes: HashMap<u32, Class>,
	pub prop_id_to_name: HashMap<u32, String>,
	pub prop_id_to_decoder: HashMap<u32, Decoder>,
	/// Per-prop_id container/scalar metadata (mirror of the JS `propIdToInfo`).
	pub prop_id_to_info: HashMap<u32, PropInfo>,
	pub qf_table: Vec<QuantizedFloat>,
	/// classId → true if this class is the game rules proxy. Used by the
	/// onlyGameRules filter (Phase 6).
	pub class_is_rules: HashMap<u32, bool>,
}

#[derive(Clone)]
pub struct Class {
	pub class_id: u32,
	pub name: String,
	pub serializer: SerializerN,
}

fn generate_serializable_field(
	field: &ProtoFlattenedSerializerFieldT,
	msg: &CsvcMsgFlattenedSerializer,
	qf_table: &mut Vec<QuantizedFloat>,
) -> ConstructorField {
	let sym = |idx: i32| -> String {
		msg.symbols.get(idx as usize).cloned().unwrap_or_default()
	};
	let var_type = sym(field.var_type_sym.unwrap_or(0));
	let serializer_name = field.field_serializer_name_sym.map(sym);
	let encoder = field.var_encoder_sym.map(sym).unwrap_or_default();
	let var_name = sym(field.var_name_sym.unwrap_or(0));

	let ft = find_field_type(&var_type);

	let mut f = ConstructorField {
		field_enum_type: None,
		bitcount: field.bit_count.unwrap_or(0) as u32,
		var_name,
		var_type,
		serializer_name,
		encoder,
		encode_flags: field.encode_flags.unwrap_or(0) as u32,
		low_value: field.low_value.unwrap_or(0.0),
		high_value: field.high_value.unwrap_or(0.0),
		field_type: ft,
		decoder: Decoder::Base,
		category: FieldCategory::Value,
	};
	f.category = find_category(&f);
	f.decoder = find_decoder(&f, qf_table);
	f
}

pub fn parse_class_info(
	send_tables_inner: &[u8],
	class_info_bytes: &[u8],
) -> Result<ClassInfo, String> {
	let serializer_msg = CsvcMsgFlattenedSerializer::decode(send_tables_inner)
		.map_err(|e| format!("CsvcMsgFlattenedSerializer decode failed: {e}"))?;
	let class_info = CDemoClassInfo::decode(class_info_bytes)
		.map_err(|e| format!("CDemoClassInfo decode failed: {e}"))?;

	let mut qf_table: Vec<QuantizedFloat> = Vec::new();

	// Build ConstructorFields. Each holds a lazily-built `field_enum_type` —
	// the first serializer to reference it triggers the build, later references
	// clone it (matches the JS `if (field.fieldEnumType === null)` pattern).
	let mut ctor_fields: Vec<ConstructorField> = serializer_msg
		.fields
		.iter()
		.map(|f| generate_serializable_field(f, &serializer_msg, &mut qf_table))
		.collect();

	let mut serializers_map: HashMap<String, SerializerN> = HashMap::new();
	let mut prop_id_to_name: HashMap<u32, String> = HashMap::new();
	let mut prop_id_to_decoder: HashMap<u32, Decoder> = HashMap::new();
	let mut prop_id_to_info: HashMap<u32, PropInfo> = HashMap::new();
	let mut state = PropIdState { next: 1000 };

	for ser in &serializer_msg.serializers {
		let ser_name = serializer_msg
			.symbols
			.get(ser.serializer_name_sym.unwrap_or(0) as usize)
			.cloned()
			.unwrap_or_default();

		let mut fields_for_this: Vec<Option<Field>> = Vec::with_capacity(ser.fields_index.len());
		for &field_index in &ser.fields_index {
			let Some(field) = ctor_fields.get_mut(field_index as usize) else {
				fields_for_this.push(None);
				continue;
			};
			if field.field_enum_type.is_none() {
				field.field_enum_type = Some(create_field(field, &serializers_map));
			}
			fields_for_this.push(field.field_enum_type.clone());
		}

		let mut serializer_value = SerializerN { name: ser_name.clone(), fields: fields_for_this };

		if verify_serializer_name(&ser_name) {
			let mut maps = TraverseMaps {
				prop_id_to_name: &mut prop_id_to_name,
				prop_id_to_decoder: &mut prop_id_to_decoder,
				prop_id_to_info: &mut prop_id_to_info,
			};
			traverse_fields(&mut serializer_value.fields, &ser_name, &mut maps, &mut state, None);
		}

		serializers_map.insert(ser_name.clone(), serializer_value);
	}

	let mut classes: HashMap<u32, Class> = HashMap::new();
	let mut class_is_rules: HashMap<u32, bool> = HashMap::new();
	for cls in &class_info.classes {
		let cls_id = cls.class_id.unwrap_or(-1);
		if cls_id < 0 {
			continue;
		}
		let network_name = cls.network_name.clone().unwrap_or_default();
		if let Some(serializer) = serializers_map.get(&network_name).cloned() {
			class_is_rules.insert(cls_id as u32, network_name == "CCSGameRulesProxy");
			classes.insert(cls_id as u32, Class { class_id: cls_id as u32, name: network_name, serializer });
		}
	}

	Ok(ClassInfo { classes, prop_id_to_name, prop_id_to_decoder, prop_id_to_info, qf_table, class_is_rules })
}

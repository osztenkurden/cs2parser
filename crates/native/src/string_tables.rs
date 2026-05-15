//! Port of `src/parser/stringtables.ts`. Parses the bit-stream of a CS2
//! string-table message, updates `EntityState.baselines` in place (for
//! `instancebaseline` entries), and returns the decoded `userinfo` players so
//! the JS side can populate `parser.players`.

use crate::bitbuffer::BitBuffer;
use crate::proto::{
	c_demo_string_tables::TableT, CMsgPlayerInfo, CsvcMsgCreateStringTable, CsvcMsgUpdateStringTable,
};

// Local alias used by the rest of this file; keeps the public API stable
// regardless of how prost names the nested type.
pub type CDemoStringTablesTableT = TableT;
pub type CmsgPlayerInfo = CMsgPlayerInfo;
use prost::Message;
use std::collections::HashMap;

#[derive(Clone, Debug)]
pub struct StringTableMeta {
	pub name: String,
	pub user_data_size: i32,
	pub user_data_fixed_size: bool,
	pub flags: i32,
	pub using_varint_bitcounts: bool,
}

#[derive(Clone, Debug, Default)]
pub struct ParsedStringTable {
	pub players: Vec<CmsgPlayerInfo>,
}

/// Walks the bit-stream of a string-table message. `baselines` is mutated in
/// place when `name == "instancebaseline"`. Returns the list of CmsgPlayerInfo
/// entries decoded when `name == "userinfo"`.
pub fn parse_string_table(
	data: &[u8],
	name: &str,
	num_entries: u32,
	udf: bool,
	user_data_size: u32,
	flags: u32,
	varint_bitcounts: bool,
	baselines: &mut HashMap<u32, Vec<u8>>,
) -> ParsedStringTable {
	let mut br = BitBuffer::new(data.to_vec());
	let mut players: Vec<CmsgPlayerInfo> = Vec::new();
	let mut keys: Vec<String> = Vec::with_capacity(32);
	let mut idx: i64 = -1;

	for _ in 0..num_entries {
		idx += 1;
		if !br.read_boolean() {
			idx += br.read_uvarint32() as i64 + 1;
		}

		let mut key = String::new();
		if br.read_boolean() {
			if br.read_boolean() {
				let position = br.read_ubits(5) as usize;
				let length = br.read_ubits(5) as usize;
				if position >= keys.len() {
					key.push_str(&br.read_string());
				} else {
					let some = keys[position].clone();
					if length > some.chars().count() {
						key.push_str(&some);
						key.push_str(&br.read_string());
					} else {
						let take: String = some.chars().take(length).collect();
						key.push_str(&take);
						key.push_str(&br.read_string());
					}
				}
			} else {
				key.push_str(&br.read_string());
			}
		}

		if keys.len() >= 32 {
			keys.remove(0);
		}
		keys.push(key.clone());

		let mut value: Option<Vec<u8>> = None;
		if br.read_boolean() {
			let bits;
			let mut is_compressed = false;
			if udf {
				bits = user_data_size as u32;
			} else {
				if (flags & 0x1) != 0 {
					is_compressed = br.read_boolean();
				}
				if varint_bitcounts {
					bits = br.read_ubit_var() * 8;
				} else {
					bits = br.read_ubits(17) * 8;
				}
			}
			let byte_len = if bits % 8 == 0 { (bits / 8) as usize } else { 0 };
			let mut v = vec![0u8; byte_len];
			br.read_bytes_into(&mut v);
			if is_compressed && !v.is_empty() {
				if let Ok(decompressed) = snap::raw::Decoder::new().decompress_vec(&v) {
					v = decompressed;
				}
			}
			value = Some(v);
		}

		if let Some(v) = value.as_ref() {
			match name {
				"userinfo" if !v.is_empty() => {
					if let Ok(p) = CmsgPlayerInfo::decode(v.as_slice()) {
						players.push(p);
					}
				}
				"instancebaseline" if !v.is_empty() && !key.is_empty() => {
					if !key.contains(':') {
						if let Ok(int_key) = key.parse::<u32>() {
							baselines.insert(int_key, v.clone());
						}
					}
				}
				_ => {}
			}
		}
	}

	ParsedStringTable { players }
}

/// Process a CSVCMsg_CreateStringTable. Stores the table metadata (for
/// later `updateStringTable` calls), updates baselines / collects users.
/// Returns `Some` only for the two tables we care about (`instancebaseline`,
/// `userinfo`); `None` for everything else, matching the JS behaviour.
pub fn handle_create_string_table(
	bytes: &[u8],
	baselines: &mut HashMap<u32, Vec<u8>>,
	tables: &mut Vec<StringTableMeta>,
) -> Option<(usize, ParsedStringTable)> {
	let msg = CsvcMsgCreateStringTable::decode(bytes).ok()?;
	let name = msg.name.unwrap_or_default();
	// JS only emits events for these two tables; mirror that filter.
	let is_tracked = name == "instancebaseline" || name == "userinfo";
	let user_data_size = msg.user_data_size.unwrap_or(0);
	let udf = msg.user_data_fixed_size.unwrap_or(false);
	let flags = msg.flags.unwrap_or(0);
	let varint_bitcounts = msg.using_varint_bitcounts.unwrap_or(false);
	let num_entries = msg.num_entries.unwrap_or(0) as u32;

	// JS pushes the metadata regardless of name — required so the table_id
	// indices in CSVCMsg_UpdateStringTable point at the right slots even for
	// tables we ignore.
	let table_id = tables.len();
	tables.push(StringTableMeta {
		name: name.clone(),
		user_data_size,
		user_data_fixed_size: udf,
		flags,
		using_varint_bitcounts: varint_bitcounts,
	});

	if !is_tracked {
		return None;
	}

	let raw = msg.string_data.unwrap_or_default();
	let data = if msg.data_compressed.unwrap_or(false) {
		snap::raw::Decoder::new().decompress_vec(&raw).unwrap_or_default()
	} else {
		raw.to_vec()
	};

	let parsed = parse_string_table(
		&data,
		&name,
		num_entries,
		udf,
		user_data_size as u32,
		flags as u32,
		varint_bitcounts,
		baselines,
	);
	Some((table_id, parsed))
}

pub fn handle_update_string_table(
	bytes: &[u8],
	baselines: &mut HashMap<u32, Vec<u8>>,
	tables: &mut [StringTableMeta],
) -> Option<(usize, ParsedStringTable)> {
	let msg = CsvcMsgUpdateStringTable::decode(bytes).ok()?;
	let table_id = msg.table_id? as usize;
	let existing = tables.get(table_id)?.clone();
	let is_tracked = existing.name == "instancebaseline" || existing.name == "userinfo";
	if !is_tracked {
		return None;
	}
	let data = msg.string_data.unwrap_or_default().to_vec();
	let parsed = parse_string_table(
		&data,
		&existing.name,
		msg.num_changed_entries.unwrap_or(0) as u32,
		existing.user_data_fixed_size,
		existing.user_data_size as u32,
		existing.flags as u32,
		existing.using_varint_bitcounts,
		baselines,
	);
	Some((table_id, parsed))
}

/// CDemoFullPacket snapshot of every string table. Mirrors
/// `applyStringTableSnapshot` in the JS port.
pub fn apply_snapshot(snapshot: &CDemoStringTablesTableT, baselines: &mut HashMap<u32, Vec<u8>>) -> ParsedStringTable {
	let mut players: Vec<CmsgPlayerInfo> = Vec::new();
	let name = snapshot.table_name.as_deref().unwrap_or("");
	if name != "instancebaseline" && name != "userinfo" {
		return ParsedStringTable { players };
	}
	for item in &snapshot.items {
		let key = item.str.as_deref().unwrap_or("");
		let value = match &item.data {
			Some(v) if !v.is_empty() => v,
			_ => continue,
		};
		match name {
			"instancebaseline" => {
				if key.contains(':') {
					continue;
				}
				if let Ok(int_key) = key.parse::<u32>() {
					baselines.insert(int_key, value.to_vec());
				}
			}
			"userinfo" => {
				if let Ok(p) = CmsgPlayerInfo::decode(value.as_slice()) {
					players.push(p);
				}
			}
			_ => {}
		}
	}
	ParsedStringTable { players }
}

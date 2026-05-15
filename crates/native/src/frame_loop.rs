//! v2 Stage 4 frame loop. Replaces the JS-side `runAsync` / `readFrame` /
//! `handleFrame` / `parsePacket` pipeline. JS feeds raw .dem bytes via
//! `feed_chunk`; Rust accumulates them, walks frames, snappy-decompresses
//! where needed, decodes the envelope protobuf, dispatches SVC messages, and
//! pushes events into the shared `DecodeResult` op stream.

use crate::bitbuffer::BitBuffer;
use crate::classinfo::{parse_class_info, ClassInfo};
use crate::entity_parser::{
	DecodeResult, EntityState, TAG_DEM_STOP, TAG_GAMEEVENT, TAG_GAMEEVENTLIST, TAG_HEADER, TAG_PLAYERINFO,
	TAG_SERVERINFO, TAG_TICKEND, TAG_TICKSTART,
};
use crate::proto::{CDemoFullPacket, CDemoPacket, CDemoSendTables};
use crate::string_tables::{apply_snapshot, handle_create_string_table, handle_update_string_table, StringTableMeta};
use prost::Message;
use std::collections::HashSet;

enum FrameOutcome {
	Consumed,
	TickPause,
	NeedMoreInput,
}

// EDemoCommands subset (mirror of `src/ts-proto/demo.ts`).
const DEM_STOP: u32 = 0;
const DEM_FILE_HEADER: u32 = 1;
const DEM_FILE_INFO: u32 = 2;
const DEM_PACKET: u32 = 7;
const DEM_SIGNON_PACKET: u32 = 8;
const DEM_CONSOLE_CMD: u32 = 9;
const DEM_CUSTOM_DATA: u32 = 10;
const DEM_CUSTOM_DATA_CALLBACKS: u32 = 11;
const DEM_USER_CMD: u32 = 12;
const DEM_FULL_PACKET: u32 = 13;
const DEM_SAVE_GAME: u32 = 14;
const DEM_SPAWN_GROUPS: u32 = 15;
const DEM_ANIMATION_DATA: u32 = 16;
const DEM_ANIMATION_HEADER: u32 = 17;
const DEM_SEND_TABLES: u32 = 4;
const DEM_CLASS_INFO: u32 = 5;
const DEM_IS_COMPRESSED: u32 = 64;

// SVC IDs we care about (from `src/ts-proto/netmessages.ts`).
const SVC_SERVER_INFO: u32 = 40;
const SVC_CREATE_STRING_TABLE: u32 = 44;
const SVC_UPDATE_STRING_TABLE: u32 = 45;
const SVC_CLEAR_ALL_STRING_TABLES: u32 = 51;
const SVC_PACKET_ENTITIES: u32 = 55;
// Game events (from `src/ts-proto/gameevents.ts`).
const GE_SOURCE1_LEGACY_GAME_EVENT_LIST: u32 = 205;
const GE_SOURCE1_LEGACY_GAME_EVENT: u32 = 207;

pub struct FrameLoop {
	/// Accumulated bytes from JS feeds. Frames consumed up to `offset`.
	buf: Vec<u8>,
	offset: usize,
	current_tick: i32,
	finished: bool,
	/// Skip the 16-byte demo magic prefix on the first feed.
	magic_skipped: bool,
	/// True after we've pushed TICKEND for the previous tick and are ready
	/// to push TICKSTART for the next frame on the following call. Required
	/// for correct game-event ordering: JS must dispatch the tickend (which
	/// fires player_death handlers reading entity state) BEFORE we process
	/// the next tick's PacketEntities and overwrite state.
	tickend_emitted: bool,
	/// Latest CDemoSendTables.data bytes — held until DEM_ClassInfo arrives,
	/// at which point classInfo is built. (Send tables come a few frames
	/// before class info.)
	pending_send_tables: Option<Vec<u8>>,
	/// String-table metadata kept across packets so `UpdateStringTable`'s
	/// `table_id` can resolve to the right name + flags.
	tables: Vec<StringTableMeta>,
	/// Optional-SVC opt-ins (svc_UserMessage, svc_UserCmds, svc_VoiceData, …).
	pub enabled_optional_svc: HashSet<u32>,
	/// Forwarded to `parse_class_info` when ready.
	pub only_game_rules: bool,
	/// When true, PacketEntities is skipped entirely (mirrors
	/// `entityMode === EntityMode.NONE` in JS parseSession).
	pub skip_entities: bool,
}

impl FrameLoop {
	pub fn new() -> Self {
		Self {
			buf: Vec::new(),
			offset: 0,
			current_tick: -1,
			finished: false,
			magic_skipped: false,
			tickend_emitted: false,
			pending_send_tables: None,
			tables: Vec::new(),
			enabled_optional_svc: HashSet::new(),
			only_game_rules: false,
			skip_entities: false,
		}
	}

	pub fn reset(&mut self) {
		self.buf.clear();
		self.offset = 0;
		self.current_tick = -1;
		self.finished = false;
		self.magic_skipped = false;
		self.pending_send_tables = None;
	}

	/// Feeds `bytes` (which may be empty when draining the internal buffer) and
	/// processes frames up to the next tick boundary. Returns `true` if Rust
	/// has more buffered work that the caller should drain by calling
	/// `feed_chunk` again with an empty slice; `false` means either the demo
	/// is exhausted or we need more input bytes before further progress.
	pub fn feed_chunk(
		&mut self,
		bytes: &[u8],
		class_info: &mut Option<ClassInfo>,
		state: &mut EntityState,
		result: &mut DecodeResult,
	) -> bool {
		// Compact the buffer occasionally so it doesn't grow unbounded.
		if self.offset > 4 * 1024 * 1024 {
			self.buf.drain(..self.offset);
			self.offset = 0;
		}
		self.buf.extend_from_slice(bytes);

		if !self.magic_skipped {
			if self.buf.len() - self.offset < 16 {
				return false;
			}
			self.offset += 16;
			self.magic_skipped = true;
		}

		while !self.finished {
			let frame_start = self.offset;
			match self.try_read_frame(class_info, state, result) {
				Ok(FrameOutcome::Consumed) => continue,
				Ok(FrameOutcome::TickPause) => {
					// Buffered more data probably exists; signal caller to drain.
					return self.offset < self.buf.len();
				}
				Ok(FrameOutcome::NeedMoreInput) => {
					self.offset = frame_start;
					return false;
				}
				Err(_) => {
					self.offset = frame_start;
					return false;
				}
			}
		}
		false
	}

	pub fn finish_stream(
		&mut self,
		_class_info: &mut Option<ClassInfo>,
		_state: &mut EntityState,
		result: &mut DecodeResult,
	) {
		if !self.finished && self.current_tick != -1 {
			// Final tickend so listeners see the last tick close out.
			result.push_tick(TAG_TICKEND, self.current_tick);
		}
	}

	/// Try to consume one frame. The return value distinguishes "consumed",
	/// "paused at tick boundary so JS can dispatch with end-of-N+1 state
	/// visible inside the TICKEND N listener", and "need more input bytes".
	///
	/// The JS-compatible event ordering: at TICKEND N, entity state has
	/// ALREADY been advanced by frame N+1's PacketEntities. The JS reference
	/// achieves this by queuing tickend/tickstart from `readFrame`, running
	/// `parsePacket` (which decodes entities), then flushing the queue. We
	/// mirror it by processing the frame first and emitting the tick events
	/// after.
	fn try_read_frame(
		&mut self,
		class_info: &mut Option<ClassInfo>,
		state: &mut EntityState,
		result: &mut DecodeResult,
	) -> Result<FrameOutcome, ()> {
		let header_start = self.offset;
		let cmd_base = self.read_varint()?;
		let tick_raw = self.read_varint()?;
		let size = self.read_varint()? as usize;

		if self.buf.len() - self.offset < size {
			self.offset = header_start;
			return Ok(FrameOutcome::NeedMoreInput);
		}

		let tick = if tick_raw == 0xffff_ffff { -1 } else { tick_raw as i32 };
		let prev_tick = self.current_tick;
		let tick_changed = prev_tick != tick;
		if tick_changed {
			self.current_tick = tick;
		}

		let cmd = cmd_base & !DEM_IS_COMPRESSED;
		let is_compressed = (cmd_base & DEM_IS_COMPRESSED) != 0;

		if cmd == DEM_STOP {
			// Final tickend uses the tick we're currently in (set above when
			// the DEM_STOP frame's tick differed). If the same tick, the
			// trailing tickend still closes out the parse cleanly.
			result.push_tick(TAG_TICKEND, self.current_tick);
			result.push_simple(TAG_DEM_STOP);
			self.finished = true;
			self.offset += size;
			return Ok(FrameOutcome::Consumed);
		}

		let payload_start = self.offset;
		self.offset += size;
		let payload_bytes = &self.buf[payload_start..payload_start + size];

		// Decompress to owned bytes if needed; else borrow.
		let decoded: Vec<u8>;
		let payload: &[u8] = if is_compressed {
			decoded = match snap::raw::Decoder::new().decompress_vec(payload_bytes) {
				Ok(v) => v,
				Err(_) => return Ok(FrameOutcome::Consumed), // skip malformed
			};
			&decoded
		} else {
			payload_bytes
		};

		// Deferred game-event bytes from the packet's SVC stream — emitted
		// only after the tick events below so the JS gameEvents emitter's
		// "queue on receipt, fire on next tickend" semantic stays intact.
		let mut deferred_gameevents: Vec<Vec<u8>> = Vec::new();

		match cmd {
			DEM_FILE_HEADER => {
				result.push_blob_event(TAG_HEADER, payload.to_vec());
			}
			DEM_SEND_TABLES => {
				self.pending_send_tables = Some(payload.to_vec());
			}
			DEM_CLASS_INFO => {
				if let Some(send_tables_bytes) = self.pending_send_tables.take() {
					if let Ok(send_tables) = CDemoSendTables::decode(send_tables_bytes.as_slice()) {
						if let Some(data) = send_tables.data {
							let mut bb = BitBuffer::new(data.to_vec());
							let inner_size = bb.read_uvarint32() as usize;
							let mut inner = vec![0u8; inner_size];
							bb.read_bytes_into(&mut inner);
							if let Ok(ci) = parse_class_info(&inner, payload) {
								state.only_game_rules = self.only_game_rules;
								*class_info = Some(ci);
							}
						}
					}
				}
			}
			DEM_PACKET | DEM_SIGNON_PACKET => {
				if let Ok(packet) = CDemoPacket::decode(payload) {
					if let Some(data) = packet.data.as_deref() {
						self.dispatch_svc(data, class_info, state, result, &mut deferred_gameevents);
					}
				}
			}
			DEM_FULL_PACKET => {
				if let Ok(fp) = CDemoFullPacket::decode(payload) {
					if let Some(st) = fp.string_table {
						for snapshot in &st.tables {
							let parsed = apply_snapshot(snapshot, &mut state.baselines);
							for player in parsed.players {
								let mut buf = Vec::new();
								player.encode(&mut buf).ok();
								result.push_blob_event(TAG_PLAYERINFO, buf);
							}
						}
					}
					if let Some(packet) = fp.packet {
						if let Some(data) = packet.data.as_deref() {
							self.dispatch_svc(data, class_info, state, result, &mut deferred_gameevents);
						}
					}
				}
			}
			_ => {}
		}

		// Order matches the OLD JS handleFrame flush: tick events first, then
		// the deferred game-event bytes. JS dispatches → tickend listener
		// sees the previous tick's gameEventQueue (empty on first crossing,
		// populated from the previous frame on subsequent ones), then
		// 'gameevent' fires for this frame's events, which queue for the
		// NEXT tickend.
		if tick_changed {
			if prev_tick != -1 {
				result.push_tick(TAG_TICKEND, prev_tick);
			}
			result.push_tick(TAG_TICKSTART, tick);
		}
		for bytes in deferred_gameevents {
			result.push_blob_event(TAG_GAMEEVENT, bytes);
		}

		// Pause after a tick crossing so JS dispatches before we advance state
		// past the next tick's PacketEntities. First tick (prev=-1) doesn't
		// need a pause — there's no previous-tick state for JS to inspect.
		if tick_changed && prev_tick != -1 {
			Ok(FrameOutcome::TickPause)
		} else {
			Ok(FrameOutcome::Consumed)
		}
	}

	fn dispatch_svc(
		&mut self,
		data: &[u8],
		class_info: &mut Option<ClassInfo>,
		state: &mut EntityState,
		result: &mut DecodeResult,
		deferred_gameevents: &mut Vec<Vec<u8>>,
	) {
		let mut br = BitBuffer::new(data.to_vec());
		// Buffer for game events that fire at end of tick (JS uses gameEventQueue).
		// We emit each one as it's encountered; ordering matches JS as long as
		// the tickend event is appended after these. Since we're inside a packet
		// (not at frame boundary), tickend fires later — good.
		while br.remaining_bits() > 8 {
			let cmd = br.read_ubit_var();
			let size = br.read_uvarint32() as usize;
			let remaining_bits = br.remaining_bits() as usize;
			if size * 8 > remaining_bits {
				break;
			}

			match cmd {
				SVC_PACKET_ENTITIES => {
					if self.skip_entities {
						br.skip_bytes_better(size as u32);
						continue;
					}
					let mut bytes = vec![0u8; size];
					br.read_bytes_into(&mut bytes);
					if let Some(ci) = class_info.as_ref() {
						if let Ok(msg) = crate::proto::CsvcMsgPacketEntities::decode(bytes.as_slice()) {
							let entity_data = msg.entity_data.unwrap_or_default();
							let updated_entries = msg.updated_entries.unwrap_or(0) as u32;
							let pvs_bits = msg.has_pvs_vis_bits_deprecated.unwrap_or(0) as u32;
							state.parse_entity_packet(&entity_data, updated_entries, pvs_bits, ci, result);
						}
					}
				}
				SVC_SERVER_INFO => {
					let mut bytes = vec![0u8; size];
					br.read_bytes_into(&mut bytes);
					result.push_blob_event(TAG_SERVERINFO, bytes);
				}
				GE_SOURCE1_LEGACY_GAME_EVENT_LIST => {
					let mut bytes = vec![0u8; size];
					br.read_bytes_into(&mut bytes);
					result.push_blob_event(TAG_GAMEEVENTLIST, bytes);
				}
				GE_SOURCE1_LEGACY_GAME_EVENT => {
					let mut bytes = vec![0u8; size];
					br.read_bytes_into(&mut bytes);
					deferred_gameevents.push(bytes);
				}
				SVC_CREATE_STRING_TABLE => {
					let mut bytes = vec![0u8; size];
					br.read_bytes_into(&mut bytes);
					if let Some((_id, parsed)) =
						handle_create_string_table(&bytes, &mut state.baselines, &mut self.tables)
					{
						for player in parsed.players {
							let mut buf = Vec::new();
							player.encode(&mut buf).ok();
							result.push_blob_event(TAG_PLAYERINFO, buf);
						}
					}
				}
				SVC_UPDATE_STRING_TABLE => {
					let mut bytes = vec![0u8; size];
					br.read_bytes_into(&mut bytes);
					if let Some((_id, parsed)) =
						handle_update_string_table(&bytes, &mut state.baselines, &mut self.tables)
					{
						for player in parsed.players {
							let mut buf = Vec::new();
							player.encode(&mut buf).ok();
							result.push_blob_event(TAG_PLAYERINFO, buf);
						}
					}
				}
				SVC_CLEAR_ALL_STRING_TABLES => {
					br.skip_bytes_better(size as u32);
					// v2: 'clearallstringtables' event removed (no internal use).
				}
				_ => {
					if self.enabled_optional_svc.contains(&cmd) {
						let mut bytes = vec![0u8; size];
						br.read_bytes_into(&mut bytes);
						result.push_optional_svc(cmd, bytes);
					} else {
						br.skip_bytes_better(size as u32);
					}
				}
			}
		}
	}

	/// Read a varint from the frame buffer at `self.offset`. Returns Err if
	/// we run out of bytes mid-varint (caller rewinds + waits for more).
	fn read_varint(&mut self) -> Result<u32, ()> {
		let mut result: u32 = 0;
		let mut shift = 0u32;
		loop {
			if self.offset >= self.buf.len() {
				return Err(());
			}
			let b = self.buf[self.offset];
			self.offset += 1;
			result |= ((b & 0x7f) as u32) << shift;
			if (b & 0x80) == 0 {
				return Ok(result);
			}
			shift += 7;
			if shift >= 35 {
				return Ok(result); // saturate; matches JS leniency
			}
		}
	}
}

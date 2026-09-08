import type { CDemoClassInfo, CDemoSendTables } from '../../ts-proto/demo.js';
import { CSVCMsg_FlattenedSerializer, ProtoFlattenedSerializerField_t } from '../../ts-proto/netmessages.js';
import { BitBuffer } from '../ubitreader.js';
import {
	constructorFieldHelper,
	Decoders,
	FieldCategory,
	findFieldType,
	type Class,
	type ConstructorField,
	type Decoder,
	type Field,
	type PropInfo,
	type SerializerN
} from './constructorFields.js';

const generateSerializableField = (
	field: ProtoFlattenedSerializerField_t,
	serializerMessage: CSVCMsg_FlattenedSerializer
) => {
	const name = serializerMessage.symbols.at(field.var_type_sym!)!;

	const serName =
		field.field_serializer_name_sym !== undefined
			? serializerMessage.symbols.at(field.field_serializer_name_sym)!
			: null;
	const encName = field.var_encoder_sym !== undefined ? serializerMessage.symbols.at(field.var_encoder_sym)! : '';
	const varName = serializerMessage.symbols.at(field.var_name_sym!)!;
	// CS2 inlines by-value embeds into the parent serializer and drops the embed's serializer
	// reference, keeping only send_node. Carry it so createField can disambiguate same-type embeds.
	const sendNode = field.send_node_sym !== undefined ? serializerMessage.symbols.at(field.send_node_sym)! : '';

	const ft = findFieldType(name);
	const varType = name;

	const f: ConstructorField = {
		fieldEnumType: null,
		bitcount: field.bit_count ?? 0,
		varName,
		sendNode,
		varType,
		serializer_name: serName,
		encoder: encName,
		encodeFlags: field.encode_flags ?? 0,
		lowValue: field.low_value ?? 0,
		highValue: field.high_value ?? 0,
		fieldType: ft,
		decoder: Decoders.BaseDecoder,
		category: FieldCategory.Value
	};

	f.category = constructorFieldHelper.findCategory(f);
	f.decoder = constructorFieldHelper.findDecoder(f);

	return f;
};

const verifySerializerName = (serializerName: string) => {
	return (
		serializerName.includes('Player') ||
		serializerName.includes('Controller') ||
		serializerName.includes('Team') ||
		serializerName.includes('Weapon') ||
		serializerName.includes('AK') ||
		serializerName.includes('cell') ||
		serializerName.includes('vec') ||
		serializerName.includes('Projectile') ||
		serializerName.includes('Knife') ||
		serializerName.includes('CDEagle') ||
		serializerName.includes('Rules') ||
		serializerName.includes('C4') ||
		serializerName.includes('Grenade') ||
		serializerName.includes('Flash') ||
		serializerName.includes('Molo') ||
		serializerName.includes('Inc') ||
		serializerName.includes('Infer')
	);
};

/**
 * Bits used to encode a server-class id on entity creation.
 *
 * Source 2 sizes the field as `floor(log2(numClasses)) + 1` — the same formula
 * demoinfocs-golang and DemoFile.Net derive from `svc_ServerInfo.max_classes`.
 * We take the count from `CDemoClassInfo` instead, which is available exactly
 * when the EntityParser is constructed and so has no message-ordering hazard.
 *
 * Hardcoding 8 bits (as this did until now) caps the parser at 255 classes;
 * demos from servers that register extra networked classes cross that line and
 * desync the bitstream on the first entity creation.
 *
 * `32 - Math.clz32(n)` is an exact integer form of `floor(log2(n)) + 1`.
 */
export const classIdBitWidth = (numClasses: number) => (numClasses < 1 ? 1 : 32 - Math.clz32(numClasses));

export const parseClassInfo = (sendTables: CDemoSendTables, cDemoClassInfo: CDemoClassInfo) => {
	if (!sendTables.data) {
		throw 'NO SEND TABLES';
	}

	const reader = new BitBuffer(sendTables.data!);

	const size = reader.ReadUVarInt32();

	const msg = Buffer.allocUnsafe(size);
	reader.readBytes(msg);

	(sendTables as any) = null;

	const serializerMessage = CSVCMsg_FlattenedSerializer.decode(msg);

	const fields: ConstructorField[] = [];

	for (const field of serializerMessage.fields) {
		fields.push(generateSerializableField(field, serializerMessage));
	}

	const map: Record<string, SerializerN> = {};

	const propIdToName: Record<number, string> = {};
	const propIdToDecoder: Record<number, Decoder> = {};
	const propIdToInfo: Record<number, PropInfo> = {};

	const classById: Class[] = [];

	const currentEntityId = { id: 1000 };

	for (const serializer of serializerMessage.serializers) {
		const serializerName = serializerMessage.symbols[serializer.serializer_name_sym!]!;

		const fieldsForThisSerializer = [] as Field[];

		for (let i = 0; i < serializer.fields_index.length; i++) {
			const fieldIndex = serializer.fields_index[i]!;

			const field = fields[fieldIndex];
			if (!field) continue;

			if (field.fieldEnumType === null) {
				field.fieldEnumType = constructorFieldHelper.createField(field, map);
			}

			const fieldType = field.fieldEnumType;

			if (fieldType !== null) {
				fieldsForThisSerializer[i] = fieldType.clone();
			}
		}

		const serializerValue: SerializerN = {
			name: serializerName,
			fields: fieldsForThisSerializer
		};
		if (verifySerializerName(serializerName)) {
			constructorFieldHelper.traverseFields(
				fieldsForThisSerializer,
				serializerName,
				propIdToName,
				currentEntityId,
				propIdToDecoder,
				propIdToInfo
			);
		}

		map[serializerName] = serializerValue;
	}

	for (const classT of cDemoClassInfo.classes) {
		const clsId = classT.class_id;
		const networkname = classT.network_name!;

		const serializer = map[networkname];
		if (serializer) {
			if (clsId === undefined) {
				continue;
			}

			classById[clsId] = {
				class_id: clsId!,
				name: networkname,
				serializer
			};
		}
	}

	// Prop ids are handed out sequentially from 1000, so the same tables index
	// cleanly as arrays. The hot decode loop reads them once per updated field;
	// a packed array element read beats a numeric key on a dictionary-mode object.
	const propInfoById: (PropInfo | undefined)[] = [];
	for (const key in propIdToInfo) propInfoById[key as unknown as number] = propIdToInfo[key as unknown as number];
	const propNameById: (string | undefined)[] = [];
	for (const key in propIdToName) propNameById[key as unknown as number] = propIdToName[key as unknown as number];

	return {
		classes: classById,
		classIdBits: classIdBitWidth(cDemoClassInfo.classes.length),
		propIdToName,
		propIdToDecoder,
		propIdToInfo,
		propInfoById,
		propNameById
	};
};

export type ClassInfo = ReturnType<typeof parseClassInfo>;

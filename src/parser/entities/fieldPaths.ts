import { popSpecial, type FieldPath } from './fieldPathOps.js';
import type { EntityParser } from './entityParser.js';
import type { BitBuffer } from '../ubitreader.js';

// Constants
const STOP_READING_SYMBOL = 39;
const HUFFMAN_CODE_MAXLEN = 17;
const LUT_SIZE = 1 << HUFFMAN_CODE_MAXLEN; // 131072

interface TreeNode {
	value: number;
	weight: number;
	left: TreeNode | null;
	right: TreeNode | null;
	leaf: boolean;
}
function compareTreeNodes(a: TreeNode, b: TreeNode) {
	if (a.weight === b.weight) {
		return b.value - a.value; // Larger value comes first when weights are equal
	} else {
		return a.weight - b.weight; // Smaller weight comes first
	}
}
function getTree(freq: [number, number][]): TreeNode {
	const nodes: TreeNode[] = [];

	for (const [value, weight] of freq) {
		nodes.push({
			value,
			weight: weight === 0 ? 1 : weight,
			left: null,
			right: null,
			leaf: true
		});
	}
	let n = nodes.length;

	while (nodes.length > 1) {
		nodes.sort(compareTreeNodes);

		const left = nodes.shift()!;
		const right = nodes.shift()!;

		const parent: TreeNode = {
			value: n,
			weight: left?.weight + right?.weight,
			left,
			right,
			leaf: false
		};

		nodes.push(parent);
		n++;
	}

	return nodes[0]!;
}

const getHuffmanTree = () => {
	const fieldPathTable = [
		36271, 10334, 1375, 646, 4128, 35, 3, 521, 2942, 560, 471, 10530, 251, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
		310, 2, 0, 1837, 149, 300, 634, 0, 0, 1, 76, 271, 99, 25474
	];
	const freq = [] as [number, number][];

	fieldPathTable.forEach((weight, index) => {
		freq[index] = [index, weight];
	});

	return getTree(freq);
};

const huffmanTree = getHuffmanTree();

// Build Huffman lookup table at module init
const huffmanSymbol = new Uint8Array(LUT_SIZE);
const huffmanLength = new Uint8Array(LUT_SIZE);

function buildLUT(node: TreeNode, code: number, depth: number) {
	if (node.leaf) {
		const count = 1 << (HUFFMAN_CODE_MAXLEN - depth);
		for (let i = 0; i < count; i++) {
			const idx = code | (i << depth);
			huffmanSymbol[idx] = node.value;
			huffmanLength[idx] = depth;
		}
		return;
	}
	buildLUT(node.left!, code, depth + 1);
	buildLUT(node.right!, code | (1 << depth), depth + 1);
}
buildLUT(huffmanTree, 0, 0);

// Inlining the field-path op dispatch into the main loop (instead of `doOp(symbol, ...)`)
// turns this from "two function-call layers per iteration" into a single switch in a hot
// loop. V8 can JIT the whole thing, including the op bodies, with no call overhead. Most
// op bodies are 1–4 lines; the few looping ones (pushN, pushNAndNonTopological,
// popNAndNonTopographical, nonTopoComplex, nonTopoComplexPack4Bits) are still inline.
// The original named `doOp` and its helpers in `fieldPathOps.ts` are kept for the unit
// tests in `tests/unit/fieldPathOps.test.ts`.
export const parsePaths = (reader: BitBuffer, entityParser: EntityParser) => {
	const fieldPath: FieldPath = {
		path: [-1, 0, 0, 0, 0, 0, 0],
		last: 0
	};
	let idx = 0;

	while (true) {
		const peeked = reader.PeekUBitsWithLog(HUFFMAN_CODE_MAXLEN);
		const symbol = huffmanSymbol[peeked]!;
		const codeLen = huffmanLength[peeked]!;
		reader.consumePeeked(codeLen);

		if (symbol === STOP_READING_SYMBOL) break;

		const path = fieldPath.path;
		switch (symbol) {
			// === Plus ===
			case 0: // plusOne
				path[fieldPath.last]! += 1;
				break;
			case 1: // plusTwo
				path[fieldPath.last]! += 2;
				break;
			case 2: // plusThree
				path[fieldPath.last]! += 3;
				break;
			case 3: // plusFour
				path[fieldPath.last]! += 4;
				break;
			case 4: // plusN
				path[fieldPath.last]! += reader.readUbitVarFp() + 5;
				break;

			// === Push one ===
			case 5: // pushOneLeftDeltaZeroRightZero
				fieldPath.last += 1;
				path[fieldPath.last] = 0;
				break;
			case 6: // pushOneLeftDeltaZeroRightNonZero
				fieldPath.last += 1;
				path[fieldPath.last]! += reader.readUbitVarFp();
				break;
			case 7: // pushOneLeftDeltaOneRightZero
				path[fieldPath.last]! += 1;
				fieldPath.last += 1;
				path[fieldPath.last] = 0;
				break;
			case 8: // pushOneLeftDeltaOneRightNonZero
				path[fieldPath.last]! += 1;
				fieldPath.last += 1;
				path[fieldPath.last] = reader.readUbitVarFp();
				break;
			case 9: // pushOneLeftDeltaNRightZero
				path[fieldPath.last]! += reader.readUbitVarFp();
				fieldPath.last += 1;
				path[fieldPath.last] = 0;
				break;
			case 10: // pushOneLeftDeltaNRightNonZero
				path[fieldPath.last]! += reader.readUbitVarFp() + 2;
				fieldPath.last += 1;
				path[fieldPath.last] = reader.readUbitVarFp() + 1;
				break;
			case 11: // pushOneLeftDeltaNRightNonZeroPack6Bits
				path[fieldPath.last]! += reader.ReadUBits(3) + 2;
				fieldPath.last += 1;
				path[fieldPath.last] = reader.ReadUBits(3) + 1;
				break;
			case 12: // pushOneLeftDeltaNRightNonZeroPack8Bits
				path[fieldPath.last]! += reader.ReadUBits(4) + 2;
				fieldPath.last += 1;
				path[fieldPath.last] = reader.ReadUBits(4) + 1;
				break;

			// === Push two ===
			case 13: // pushTwoLeftDeltaZero
				fieldPath.last += 1;
				path[fieldPath.last]! += reader.readUbitVarFp();
				fieldPath.last += 1;
				path[fieldPath.last]! += reader.readUbitVarFp();
				break;
			case 14: // pushTwoPack5LeftDeltaZero
				fieldPath.last += 1;
				path[fieldPath.last] = reader.ReadUBits(5);
				fieldPath.last += 1;
				path[fieldPath.last] = reader.ReadUBits(5);
				break;
			case 17: // pushTwoLeftDeltaOne
				path[fieldPath.last]! += 1;
				fieldPath.last += 1;
				path[fieldPath.last]! += reader.readUbitVarFp();
				fieldPath.last += 1;
				path[fieldPath.last]! += reader.readUbitVarFp();
				break;
			case 18: // pushTwoPack5LeftDeltaOne
				path[fieldPath.last]! += 1;
				fieldPath.last += 1;
				path[fieldPath.last]! += reader.ReadUBits(5);
				fieldPath.last += 1;
				path[fieldPath.last]! += reader.ReadUBits(5);
				break;
			case 21: // pushTwoLeftDeltaN
				path[fieldPath.last]! += reader.readUbitVar() + 2;
				fieldPath.last += 1;
				path[fieldPath.last]! += reader.readUbitVarFp();
				fieldPath.last += 1;
				path[fieldPath.last]! += reader.readUbitVarFp();
				break;
			case 22: // pushTwoPack5LeftDeltaN
				path[fieldPath.last]! += reader.readUbitVar() + 2;
				fieldPath.last += 1;
				path[fieldPath.last]! += reader.ReadUBits(5);
				fieldPath.last += 1;
				path[fieldPath.last]! += reader.ReadUBits(5);
				break;

			// === Push three ===
			case 15: // pushThreeLeftDeltaZero
				fieldPath.last += 1;
				path[fieldPath.last]! += reader.readUbitVarFp();
				fieldPath.last += 1;
				path[fieldPath.last]! += reader.readUbitVarFp();
				fieldPath.last += 1;
				path[fieldPath.last]! += reader.readUbitVarFp();
				break;
			case 16: // pushThreePack5LeftDeltaZero
				fieldPath.last += 1;
				path[fieldPath.last] = reader.ReadUBits(5);
				fieldPath.last += 1;
				path[fieldPath.last] = reader.ReadUBits(5);
				fieldPath.last += 1;
				path[fieldPath.last] = reader.ReadUBits(5);
				break;
			case 19: // pushThreeLeftDeltaOne
				path[fieldPath.last]! += 1;
				fieldPath.last += 1;
				path[fieldPath.last]! += reader.readUbitVarFp();
				fieldPath.last += 1;
				path[fieldPath.last]! += reader.readUbitVarFp();
				fieldPath.last += 1;
				path[fieldPath.last]! += reader.readUbitVarFp();
				break;
			case 20: // pushThreePack5LeftDeltaOne
				path[fieldPath.last]! += 1;
				fieldPath.last += 1;
				path[fieldPath.last]! += reader.ReadUBits(5);
				fieldPath.last += 1;
				path[fieldPath.last]! += reader.ReadUBits(5);
				fieldPath.last += 1;
				path[fieldPath.last]! += reader.ReadUBits(5);
				break;
			case 23: // pushThreeLeftDeltaN
				path[fieldPath.last]! += reader.readUbitVar() + 2;
				fieldPath.last += 1;
				path[fieldPath.last]! += reader.readUbitVarFp();
				fieldPath.last += 1;
				path[fieldPath.last]! += reader.readUbitVarFp();
				fieldPath.last += 1;
				path[fieldPath.last]! += reader.readUbitVarFp();
				break;
			case 24: // pushThreePack5LeftDeltaN
				path[fieldPath.last]! += reader.readUbitVar() + 2;
				fieldPath.last += 1;
				path[fieldPath.last]! += reader.ReadUBits(5);
				fieldPath.last += 1;
				path[fieldPath.last]! += reader.ReadUBits(5);
				fieldPath.last += 1;
				path[fieldPath.last]! += reader.ReadUBits(5);
				break;

			// === Push N + non-topological push ===
			case 25: {
				// pushN
				const n = reader.readUbitVar();
				path[fieldPath.last]! += reader.readUbitVar();
				for (let i = 0; i < n; i++) {
					fieldPath.last += 1;
					path[fieldPath.last]! += reader.readUbitVarFp();
				}
				break;
			}
			case 26: {
				// pushNAndNonTopological
				for (let i = 0; i < fieldPath.last + 1; i++) {
					if (reader.readBoolean()) {
						path[i]! += reader.readVarInt32() + 1;
					}
				}
				const count = reader.readUbitVar();
				for (let i = 0; i < count; i++) {
					fieldPath.last += 1;
					path[fieldPath.last] = reader.readUbitVarFp();
				}
				break;
			}

			// === Pop ===
			case 27: // popOnePlusOne
				popSpecial(fieldPath, 1);
				path[fieldPath.last]! += 1;
				break;
			case 28: // popOnePlusN
				popSpecial(fieldPath, 1);
				path[fieldPath.last]! += reader.readUbitVarFp() + 1;
				break;
			case 29: // popAllButOnePlusOne
				popSpecial(fieldPath, fieldPath.last);
				path[0] += 1;
				break;
			case 30: // popAllButOnePlusN
				popSpecial(fieldPath, fieldPath.last);
				path[0] += reader.readUbitVarFp() + 1;
				break;
			case 31: // popAllButOnePlusNPack3Bits
				popSpecial(fieldPath, fieldPath.last);
				path[0] += reader.ReadUBits(3) + 1;
				break;
			case 32: // popAllButOnePlusNPack6Bits
				popSpecial(fieldPath, fieldPath.last);
				path[0] += reader.ReadUBits(6) + 1;
				break;
			case 33: // popNPlusOne
				popSpecial(fieldPath, reader.readUbitVarFp());
				path[fieldPath.last]! += 1;
				break;
			case 34: // popNPlusN
				popSpecial(fieldPath, reader.readUbitVarFp());
				path[fieldPath.last]! += reader.readVarInt32();
				break;
			case 35: {
				// popNAndNonTopographical
				popSpecial(fieldPath, reader.readUbitVarFp());
				for (let i = 0; i < fieldPath.last + 1; i++) {
					if (reader.readBoolean()) {
						path[i]! += reader.readVarInt32();
					}
				}
				break;
			}

			// === Non-topological ===
			case 36: {
				// nonTopoComplex
				for (let i = 0; i < fieldPath.last + 1; i++) {
					if (reader.readBoolean()) {
						path[i]! += reader.readVarInt32();
					}
				}
				break;
			}
			case 37: // nonTopoPenultimatePlusOne
				path[fieldPath.last - 1]! += 1;
				break;
			case 38: {
				// nonTopoComplexPack4Bits
				for (let i = 0; i < fieldPath.last + 1; i++) {
					if (reader.readBoolean()) {
						path[i]! += reader.ReadUBits(4) - 7;
					}
				}
				break;
			}

			default:
				throw 'PathError.GenericPathOpError';
		}

		entityParser.writeFp(fieldPath, idx);

		idx++;
	}
	return idx;
};

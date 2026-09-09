import { doOp } from './fieldPathOps.js';
import type { EntityParser } from './entityParser.js';
import type { BitBuffer } from '../ubitreader.js';
import type { SerializerN } from './constructorFields.js';

// Constants
const STOP_READING_SYMBOL = 39;
const HUFFMAN_PREFIX_BITS = 8;
const LUT_SIZE = 1 << HUFFMAN_PREFIX_BITS;

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

// Common codes fit in a 512-byte primary table. Rare long codes use the remaining tree.
const huffmanCodes = new Uint16Array(LUT_SIZE);
const huffmanLongRoots: (TreeNode | undefined)[] = [];

function buildLUT(node: TreeNode, code: number, depth: number) {
	if (node.leaf) {
		const count = 1 << (HUFFMAN_PREFIX_BITS - depth);
		for (let i = 0; i < count; i++) {
			const idx = code | (i << depth);
			huffmanCodes[idx] = (depth << 6) | node.value;
		}
		return;
	}
	if (depth === HUFFMAN_PREFIX_BITS) {
		huffmanLongRoots[code] = node;
		return;
	}
	buildLUT(node.left!, code, depth + 1);
	buildLUT(node.right!, code | (1 << depth), depth + 1);
}
buildLUT(huffmanTree, 0, 0);

export const parsePaths = (
	reader: BitBuffer,
	entityParser: Pick<EntityParser, 'fieldPath' | 'writeFp'>,
	serializer: SerializerN
) => {
	const fieldPath = entityParser.fieldPath;
	const p = fieldPath.path;
	p[0] = -1;
	p[1] = 0;
	p[2] = 0;
	p[3] = 0;
	p[4] = 0;
	p[5] = 0;
	p[6] = 0;
	fieldPath.last = 0;
	let idx = 0;

	while (true) {
		const prefix = reader.peekHuffmanPrefix();
		let code = huffmanCodes[prefix]!;
		if (code === 0) {
			// Do not consume the prefix separately: a truncated code must fail atomically.
			let node = huffmanLongRoots[prefix]!;
			const peeked = reader.peekHuffmanCode();
			let depth = HUFFMAN_PREFIX_BITS;
			while (!node.leaf) node = (peeked >>> depth++) & 1 ? node.right! : node.left!;
			code = (depth << 6) | node.value;
		}
		const symbol = code & 63;
		reader.consumePeeked(code >>> 6);

		if (symbol === STOP_READING_SYMBOL) break;

		if (symbol < 4) p[fieldPath.last]! += symbol + 1;
		else if (symbol === 4) p[fieldPath.last]! += reader.readUbitVarFp() + 5;
		else doOp(symbol, reader, fieldPath);

		entityParser.writeFp(fieldPath, idx, serializer);

		idx++;
	}
	return idx;
};

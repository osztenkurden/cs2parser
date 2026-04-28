import { describe, test, expect } from 'bun:test';
import { buildFragmentPrefix, validateSync } from '../../../src/broadcast/sync.js';
import { BroadcastProtocolError } from '../../../src/broadcast/errors.js';

describe('validateSync', () => {
	const valid = {
		tick: 100,
		rtdelay: 1.0,
		rcvage: 0.5,
		fragment: 5,
		signup_fragment: 0,
		tps: 64,
		protocol: 5
	};

	test('accepts a minimal valid sync DTO', () => {
		const dto = validateSync(valid);
		expect(dto.tick).toBe(100);
		expect(dto.protocol).toBe(5);
	});

	test('rejects null', () => {
		expect(() => validateSync(null)).toThrow(BroadcastProtocolError);
	});

	test('rejects non-object', () => {
		expect(() => validateSync('not an object')).toThrow(BroadcastProtocolError);
	});

	test('rejects unsupported protocol', () => {
		expect(() => validateSync({ ...valid, protocol: 4 })).toThrow(/protocol 4/);
	});

	test('rejects missing required field', () => {
		const { tps: _ignored, ...incomplete } = valid;
		expect(() => validateSync(incomplete)).toThrow(/tps/);
	});

	test('passes through optional fields', () => {
		const dto = validateSync({
			...valid,
			keyframe_interval: 3,
			endtick: 200,
			maxtick: 1000,
			map: 'de_mirage',
			token_redirect: 'match-1'
		});
		expect(dto.keyframe_interval).toBe(3);
		expect(dto.endtick).toBe(200);
		expect(dto.maxtick).toBe(1000);
		expect(dto.map).toBe('de_mirage');
		expect(dto.token_redirect).toBe('match-1');
	});

	test('omits empty token_redirect', () => {
		const dto = validateSync({ ...valid, token_redirect: '' });
		expect(dto.token_redirect).toBeUndefined();
	});
});

describe('buildFragmentPrefix', () => {
	test('returns empty string when no token_redirect', () => {
		expect(buildFragmentPrefix(undefined)).toBe('');
		expect(buildFragmentPrefix('')).toBe('');
	});

	test('appends single trailing slash', () => {
		expect(buildFragmentPrefix('match-1')).toBe('match-1/');
	});

	test('strips redundant trailing slashes and re-adds one', () => {
		expect(buildFragmentPrefix('match-1/')).toBe('match-1/');
		expect(buildFragmentPrefix('match-1///')).toBe('match-1/');
	});
});

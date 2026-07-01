import { describe, test, expect } from 'bun:test';
import type { DemoReader, EntityPropKey } from '../../src/index.js';

/**
 * Compile-time contract for the generic prop getters. This function is never executed — it exists
 * so `bun run typecheck` validates the typing (including the `@ts-expect-error` negatives, which
 * fail the build if the erroneous call ever starts compiling).
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _typeChecks(reader: DemoReader) {
	// 1) No type argument → `name` is plain `string` (any name; back-compatible).
	reader.getNumberProp(1, 'literally.anything');
	reader.getStringProp(1, 'CCSPlayerController.m_iszPlayerName');
	reader.getArrayProp(1, 'whatever.path');

	// 2) With a class type argument → real keys of that class are accepted (and autocompleted).
	reader.getNumberProp<'CAK47'>(1, 'CAK47.m_AttributeManager.m_Item.m_iItemDefinitionIndex');
	reader.getStringProp<'CAK47'>(1, 'CAK47.m_AttributeManager.m_Item.m_szCustomName');
	reader.getNumberProp<'CCSPlayerController'>(1, 'CCSPlayerController.m_iPing');

	// 3) With a class type argument → non-keys are rejected.
	// @ts-expect-error — not a real CAK47 property
	reader.getNumberProp<'CAK47'>(1, 'CAK47.not_a_real_field');
	// @ts-expect-error — key belongs to a different class
	reader.getNumberProp<'CAK47'>(1, 'CCSPlayerController.m_iPing');

	// 4) VALUE-TYPE safety: a getter only accepts keys whose value type matches its kind.
	//    m_iAccountID is a number, m_szCustomName a string, m_bInitialized a bool,
	//    m_AttributeList.m_Attributes a container (array of structs).
	reader.getNumberProp<'CAK47'>(1, 'CAK47.m_AttributeManager.m_Item.m_iAccountID');
	reader.getBoolProp<'CAK47'>(1, 'CAK47.m_AttributeManager.m_Item.m_bInitialized');
	reader.getArrayProp<'CAK47'>(1, 'CAK47.m_AttributeManager.m_Item.m_AttributeList.m_Attributes');

	// @ts-expect-error — m_iAccountID is a number, so it is NOT a getArrayProp key (the user's case)
	reader.getArrayProp<'CAK47'>(1, 'CAK47.m_AttributeManager.m_Item.m_iAccountID');
	// @ts-expect-error — m_szCustomName is a string, not a number
	reader.getNumberProp<'CAK47'>(1, 'CAK47.m_AttributeManager.m_Item.m_szCustomName');
	// @ts-expect-error — the struct array is a container, not a number
	reader.getNumberProp<'CAK47'>(1, 'CAK47.m_AttributeManager.m_Item.m_AttributeList.m_Attributes');
	// @ts-expect-error — m_bInitialized is a bool, not a string
	reader.getStringProp<'CAK47'>(1, 'CAK47.m_AttributeManager.m_Item.m_bInitialized');

	// The exact case from the request: m_iMostRecentTeamNumber is a number on CAK47.
	reader.getNumberProp<'CAK47'>(1, 'CAK47.m_iMostRecentTeamNumber');
	// @ts-expect-error — a number field must NOT be reachable through getArrayProp
	reader.getArrayProp<'CAK47'>(1, 'CAK47.m_iMostRecentTeamNumber');

	// EntityPropKey resolves to the class's fully-qualified keys.
	const key: EntityPropKey<'CAK47'> = 'CAK47.m_AttributeManager.m_Item.m_iAccountID';
	return key;
}

describe('prop getter types', () => {
	test('generic name typing compiles (validated by typecheck via _typeChecks)', () => {
		expect(typeof _typeChecks).toBe('function');
	});
});

// Synthetic fixture, not a real match key or player message. ICE level 2,
// ASCII key 0123456789ABCDEF, CS2 UBitVar(118), SayText2("Hello, world!").
export const encryptedChatKeyValue = '81985529216486895';
export const encryptedChatCiphertext = Uint8Array.from(
	'070196c51e5f2ed88261844039903f144d666d619df960ef5db446be9fa3802b736dc8cf8db65b668c3e17e9fd83833f01925b53696ee715239dc42eaaa42b0a'.match(
		/../g
	)!,
	byte => Number.parseInt(byte, 16)
);

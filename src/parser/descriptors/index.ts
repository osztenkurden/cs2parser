import { gameMessages } from './gameevents.js';
import { svcMessages, optionalSvcMessages } from './svc.js';

const map = <T extends Record<number, any>>(m: T) => {
	return Object.entries(m).reduce(
		(a, b) => ({ ...a, [b[0]]: { id: Number(b[0]), class: b[1] } }),
		{} as { [K in keyof T]: { id: K; class: T[K] } }
	);
};

export const messages = { ...map(gameMessages), ...map(svcMessages), ...map(optionalSvcMessages) } as const;

// Use the portable package explicitly, including when running under Node.
// @ts-expect-error The package has no declarations; its public interface is typed below.
import EventEmitter from 'events/events.js';

type Listener = (...args: any[]) => void;
export type EmitterMetaEvents = {
	newListener: [eventName: string | symbol, listener: Listener];
	removeListener: [eventName: string | symbol, listener: Listener];
};

/** Node-compatible event semantics with declarations that need no Node types. */
export interface TypedEventEmitter<T extends { [K in keyof T]: any[] }> {
	on<K extends keyof T>(event: K, listener: (...args: T[K]) => void): this;
	addListener<K extends keyof T>(event: K, listener: (...args: T[K]) => void): this;
	once<K extends keyof T>(event: K, listener: (...args: T[K]) => void): this;
	prependListener<K extends keyof T>(event: K, listener: (...args: T[K]) => void): this;
	prependOnceListener<K extends keyof T>(event: K, listener: (...args: T[K]) => void): this;
	off<K extends keyof T>(event: K, listener: (...args: T[K]) => void): this;
	removeListener<K extends keyof T>(event: K, listener: (...args: T[K]) => void): this;
	removeAllListeners(event?: keyof T): this;
	emit<K extends keyof T>(event: K, ...args: T[K]): boolean;
	listenerCount(event: string | symbol): number;
	listeners<K extends keyof T>(event: K): ((...args: T[K]) => void)[];
	rawListeners<K extends keyof T>(event: K): ((...args: T[K]) => void)[];
	eventNames(): (keyof T)[];
	setMaxListeners(count: number): this;
	getMaxListeners(): number;
}

export const TypedEventEmitter = EventEmitter as {
	new <T extends { [K in keyof T]: any[] }>(): TypedEventEmitter<T>;
};

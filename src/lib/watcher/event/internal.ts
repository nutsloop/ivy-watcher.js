import { EventEmitter } from 'node:events';

import type { WatcherIntegrity, WatcherIntegrityData } from '../thread/integrity.js';

export type WatcherInternalEventListener = {
  'change-detected': ( event: { event: string, filename: string}, WatcherData?: WatcherIntegrityData ) => Promise<void>
  'found-directory': ( filename: string ) => Promise<void>
  'hash-watcher': ( WatcherIntegrity: WatcherIntegrity, filename: string, event: string, crc32: { crc32: string, index: string } ) => Promise<void>
  'integrity-ready': ( data: WatcherIntegrity ) => Promise<void>
  'integrity-updated': ( data: WatcherIntegrity, event: Map<'type', 'created'|'deleted'|'moved'> ) => Promise<void>
  'queued': ( event: {event:string, filename:string} ) => Promise<void>
};

type EventTypeInternal = Record<number | string | symbol, ( ...data: unknown[] ) => Promise<void> | void>;

export interface IWatcherEmitterInternal<T extends EventTypeInternal = WatcherInternalEventListener> extends EventEmitter{
  emit<eventName extends keyof T>( event: eventName, ...args: Parameters<T[eventName]> ): boolean;
  on<eventName extends keyof T>( eventName: eventName, listener: T[eventName] ): this;
}

export const WatcherInternalEvent: IWatcherEmitterInternal = new EventEmitter();

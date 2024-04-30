import { EventEmitter } from 'node:events';

import { WatcherIntegrityData } from '../thread/integrity.js';

type WatcherEventListener = {
  'all': ( path: string ) => Promise<void>
  'changed': ( path: string, integrityData?: WatcherIntegrityData ) => Promise<void>
  'created': ( path: string, integrityData?: WatcherIntegrityData ) => Promise<void>
  'deleted': ( path: string, integrityData?: WatcherIntegrityData ) => Promise<void>
  'moved': ( path: string, integrityData?: WatcherIntegrityData ) => Promise<void>
  'ready': ( integrityData?: WatcherIntegrityData ) => Promise<void>
};

type EventType = Record<number | string | symbol, ( ...data: unknown[] ) => Promise<void> | void>;

export interface IWatcherEmitter<T extends EventType = WatcherEventListener> extends EventEmitter{
  emit<eventName extends keyof T>( event: eventName, ...args: Parameters<T[eventName]> ): boolean;
  on<eventName extends keyof T>( eventName: eventName, listener: T[eventName] ): this;
}

export const WatcherEvent: IWatcherEmitter = new EventEmitter();

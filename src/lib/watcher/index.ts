import { Path } from '@ivy-industries/cross-path';
import { readdir } from 'node:fs/promises';
import { Worker } from 'node:worker_threads';

import type { WatcherIntegrity } from './thread/integrity.js';

import { crc } from '../rust/crc.js';
import { type IWatcherEmitterInternal, WatcherInternalEvent } from './event/internal.js';
import { type IWatcherEmitter, WatcherEvent } from './event/watcher.js';
import { foundDirectory } from './function/foundDirectory.js';
import { foundFile } from './function/foundFile.js';

type WatcherParametersSetting = {
  disable_integrity?: boolean
  exclude?: string[]
  look_up_deleted_interval?: number
  refresh_integrity?: boolean
}

type WatcherSetting =
  Map<'path', string> &
  Map<'interval', number> &
  Map<'disable-integrity' | 'refresh-integrity', boolean> &
  Map<'exclude', string[]>

export const watcher_setting: WatcherSetting = new Map();
const p = new Path();
const WatcherData: WatcherIntegrity = new Map();

function thread_worker_path( which: 'integrity' | 'watch' ): string{

  return p.resolve( p.dirname( new URL( import.meta.url ).pathname ), `thread/${which}.js` );
}

export async function watcher( path?: string, setting?: WatcherParametersSetting ): Promise<IWatcherEmitter> {

  set_watcher( setting );

  if( ! watcher_setting.has( 'path' ) ){

    watcher_setting.set( 'path', path !== undefined ? path : p.cwd() );
  }

  if ( watcher_setting.get( 'disable-integrity' ) ) {

    watch_event( path, true );
  }
  else{

    const integrity_task = integrity( path );
    integrity_task.on( 'integrity-ready', async ( WatcherData ) => {

      for ( const [ key, value ] of WatcherData ) {

        WatcherData.set( key, value );
      }

      watch_event( path, false );
    } );
  }

  return WatcherEvent;
}

function watch_event( path: string, disable_integrity: boolean ): void{

  const watch_task = watch( path );
  watch_task.on( 'change-detected', async ( { event, filename } ) => {

    WatcherEvent.emit( 'all', filename );
    if( await foundDirectory( filename ) ){

      WatcherInternalEvent.emit( 'found-directory', filename );
    }

    if( disable_integrity === false ){
      if( event === 'rename' ) {

        await event_rename( filename );
      }
      else if( event === 'change' ) {

        await event_change( filename );
      }
    }
  } );
}

function watch( path: string ): IWatcherEmitterInternal{

  const thread = new Worker( thread_worker_path( 'watch' ) );
  thread.on( 'error', ( error ) => {

    throw error;
  } );

  thread.on( 'exit', ( code ) => {

    if ( code !== 0 ) {

      throw new Error( `Worker Watch stopped with exit code ${ code }` );
    }
  } );

  thread.on( 'message', async ( { event, filename } ) => {

    WatcherInternalEvent.emit( 'change-detected', { event, filename } );
  } );

  thread.on( 'online', () => {

    WatcherInternalEvent.on( 'found-directory', async ( path ) => {

      thread.postMessage( { exclude: watcher_setting?.get( 'exclude' ), path: path } );
    } );
    thread.postMessage( { exclude: watcher_setting?.get( 'exclude' ), path: path } );
  } );

  setInterval( async () => {

    for ( const [ key, value ] of WatcherData ) {

      if( value.marked_for_deletion === true ) {

        WatcherData.delete( key );
        WatcherEvent.emit( 'deleted', key, WatcherData.get( key ) );
      }
    }

    if( watcher_setting.get( 'refresh-integrity' ) ){

      await integrity_refresh( watcher_setting.get( 'path' ) );
    }
  }, watcher_setting.get( 'interval' ) );

  return WatcherInternalEvent;
}

function set_watcher( setting: WatcherParametersSetting ): void {

  if( setting?.look_up_deleted_interval < 1000 ){

    throw new Error( 'Interval must be greater than 1000ms' );
  }

  watcher_setting.set( 'interval', setting?.look_up_deleted_interval || 5000 );
  watcher_setting.set( 'refresh-integrity', setting?.refresh_integrity || true );
  watcher_setting.set( 'disable-integrity', setting?.disable_integrity || false );
  watcher_setting.set( 'exclude', setting?.exclude || [] );
}

async function event_change( filename: string ): Promise<void> {

  if( WatcherData.has( filename ) ) {

    WatcherData.set( filename, await crc( filename, true, true, true ) );
    WatcherEvent.emit( 'changed', filename, WatcherData.get( filename ) );
  }
}

async function event_rename( filename: string ): Promise<void> {

  if( WatcherData.has( filename ) ) {

    WatcherData.get( filename ).marked_for_deletion = true;
  }
  else {

    const integrity_task = integrity( filename, true );
    integrity_task.once( 'integrity-updated', async ( kWatcherData, event ) => {

      kWatcherData.clear();
      for ( const [ key, value ] of kWatcherData ) {

        WatcherData.set( key, value );
      }
      if( event.get( 'type' ) === 'moved' ) {

        WatcherEvent.emit( 'moved', filename, WatcherData.get( filename ) );
      }
      else if( event.get( 'type' ) === 'created' ) {

        if( await foundFile( filename ) ){

          WatcherEvent.emit( 'created', filename, WatcherData.get( filename ) );
        }
        else if( ! await foundDirectory( filename ) ){

          WatcherEvent.emit( 'deleted', filename, WatcherData.get( filename ) );
        }
        else if( await foundDirectory( filename ) ){

          WatcherEvent.emit( 'created', filename, WatcherData.get( filename ) );
        }
      }
    } );
  }
}

function integrity( path: string, update: boolean = false ): IWatcherEmitterInternal{

  const thread = new Worker( thread_worker_path( 'integrity' ) );
  thread.on( 'error', ( error ) => {
    throw error;
  } );

  thread.on( 'exit', ( code ) => {

    if ( code !== 0 ) {

      throw new Error( `Worker Integrity stopped with exit code ${ code }` );
    }
  } );

  thread.on( 'message', async ( { event, integrity } ) => {

    if( update ){

      WatcherData.clear();
      for ( const [ key, value ] of integrity ) {

        WatcherData.set( key, value );
      }
      WatcherInternalEvent.emit( 'integrity-updated', integrity, event );
    }
    else{

      WatcherInternalEvent.emit( 'integrity-ready', integrity );
      WatcherEvent.emit( 'ready', integrity );
    }
  } );

  thread.on( 'online', () => {

    if( update ){

      thread.postMessage( { exclude: watcher_setting.get( 'exclude' ), integrity_map: WatcherData, path: path, update: true } );
    }
    else{

      thread.postMessage( { exclude: watcher_setting.get( 'exclude' ), path: path, update: false } );
    }
  } );

  return WatcherInternalEvent;
}

async function integrity_refresh( path: string ): Promise<void>{

  if( await foundFile( path ) ){

    const crc32 = await crc( path, true, true, true )
      .catch( ( error: Error ) => {
        throw error;
      } );

    WatcherData.set(
      crc32.index, {
        accessed: crc32.accessed,
        crc32: crc32.crc32,
        created: crc32.created,
        data: crc32.data,
        filename: crc32.filename,
        marked_for_deletion: false,
        mode: crc32.mode,
        modified: crc32.modified,
        path: crc32.path,
        size: crc32.size
      }
    );
  }
  else{

    const recursiveDir = await readdir( path, { withFileTypes: true } )
      .catch( ( error: Error ) => {
        throw error;
      } );

    for ( const dirent of recursiveDir ) {

      if ( dirent.isDirectory() ) {

        await integrity_refresh( `${ dirent.path }/${ dirent.name }` );
      }
      else if ( dirent.isFile() && ! watcher_setting.get( 'exclude' ).includes( dirent.name ) ) {

        const crc32 = await crc( `${ dirent.path }/${ dirent.name }`, true, true, true )
          .catch( ( error: Error ) => {
            throw error;
          } );

        WatcherData.set(
          crc32.index, {
            accessed: crc32.accessed,
            crc32: crc32.crc32,
            created: crc32.created,
            data: crc32.data,
            filename: crc32.filename,
            marked_for_deletion: false,
            mode: crc32.mode,
            modified: crc32.modified,
            path: crc32.path,
            size: crc32.size
          }
        );
      }
    }
  }
}

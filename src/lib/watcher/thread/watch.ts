import { Path } from '@nutsloop/ivy-cross-path';
import { readdir, watch } from 'node:fs/promises';
import { Worker, parentPort } from 'node:worker_threads';

import { foundDirectory } from '../function/foundDirectory.js';

const p = new Path();
const base_path = [];

function thread_worker_path(): string{

  return p.resolve( p.dirname( new URL( import.meta.url ).pathname ), `sub/fs-watch.js` );
}

/**
 * excluded logic
 * todo - logic for relative paths and absolute paths.
 * todo - behaviour controlled by a flag.
 */

parentPort.on( 'message', async ( { exclude, path } ) => {

  thread( path, exclude );
  base_path.push( 0 );
  await spawn_threads( path, exclude );
} );

async function not_excluded( path: string, exclude?: string[] ): Promise<boolean>{

  if( exclude !== undefined && exclude.length > 0 ){

    if( exclude.includes( path ) ){

      return false;
    }
  }

  return true;
}

async function spawn_threads( path: string, exclude: string[] ): Promise<void>{

  const recursiveDir = await readdir( path, { withFileTypes: true } )
    .catch( ( error: Error ) => {
      throw error;
    } );

  for ( const dirent of recursiveDir ) {

    if ( dirent.isDirectory() ) {

      if( ! exclude.includes( dirent.name ) ){

        thread( `${ dirent.parentPath }/${ dirent.name }`, exclude );

        await spawn_threads( `${ dirent.parentPath }/${ dirent.name }`, exclude );
      }
    }
  }
}

function thread( path: string, exclude: string[] ): void{

  const thread = new Worker( thread_worker_path() );
  thread.on( 'error', ( error ) => {

    throw error;
  } );

  thread.on( 'exit', ( code ) => {

    if ( code !== 0 ) {

      throw new Error( `Worker FS-Watch stopped with exit code ${ code }` );
    }
  } );

  thread.on( 'message', async ( { event, filename } ) => {

    parentPort.postMessage( { event, filename } );
    if( await foundDirectory( filename ) ){

      spawn_threads( filename, exclude );
    }
  } );

  thread.on( 'online', () => {

    thread.postMessage( { exclude, path } );
  } );
}

async function _fs_watch( path: string, exclude: string[] ): Promise<void>{

  const watcher = watch( path, { recursive: true } );

  for await ( const watcherEvent of watcher ) {

    if( await not_excluded( watcherEvent.filename, exclude ) ){

      if( watcherEvent.filename.at( watcherEvent.filename.length - 1 ) !== '~' ){

        parentPort.postMessage( { event: watcherEvent.eventType, filename: watcherEvent.filename } );
      }
    }
  }
}

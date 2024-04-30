import { readdir } from 'node:fs/promises';
import { parentPort } from 'node:worker_threads';

import { crc } from '../../rust/crc.js';
import { foundFile } from '../function/foundFile.js';

export type WatcherIntegrityData = {
  accessed?: number|string,
  crc32: string,
  created?: number|string,
  data?: Buffer|string,
  filename?: string,
  marked_for_deletion?: boolean,
  mode?: string,
  modified?: number|string,
  path?: string,
  size?: number,
};

export type WatcherIntegrity = Map<string, WatcherIntegrityData>;

const integrityMap: WatcherIntegrity = new Map();
const event: Map<'type', 'created' | 'moved'> = new Map( [ [ 'type', 'created' ] ] );
const excluded: string[] = [];

parentPort.on( 'message', async ( { exclude, integrity_map, path, update } ) => {

  if( exclude !== undefined && exclude.length > 0 ){

    for ( const exclude_path of exclude ) {

      excluded.push( exclude_path );
    }
  }

  if( update ){

    await integrity_update( path, integrity_map );
  }
  else{

    await compute( path );
  }

  parentPort.postMessage( { event: event, integrity: integrityMap } );
  process.exit();
} );

async function compute( path: string ): Promise<void>{

  if( await foundFile( path ) ){

    const crc32 = await crc( path, true, true, true )
      .catch( ( error: Error ) => {
        throw error;
      } );

    integrityMap.set(
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

        await compute( `${ dirent.path }/${ dirent.name }` );
      }
      else if ( dirent.isFile() && ! excluded.includes( dirent.name ) ) {

        const crc32 = await crc( `${ dirent.path }/${ dirent.name }`, true, true, true )
          .catch( ( error: Error ) => {
            throw error;
          } );

        integrityMap.set(
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

async function integrity_update( path: string, integrity_map: WatcherIntegrity ){

  integrityMap.clear();
  for ( const [ key, value ] of integrity_map ) {

    integrityMap.set( key, value );
  }

  if( await foundFile( path ) ){

    const crc32 = await crc( path, true, true, true )
      .catch( ( error: Error ) => {
        throw error;
      } );

    integrityMap.set(
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

    for ( const [ key, value ] of integrityMap ) {

      if ( value.marked_for_deletion ) {

        if( integrityMap.get( key ).crc32 === integrityMap.get( path ).crc32 ){

          integrityMap.delete( key );
          event.set( 'type', 'moved' );
        }
      }
    }
  }
}

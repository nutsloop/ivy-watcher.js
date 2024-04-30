import { watch } from 'node:fs/promises';
import { parentPort } from 'node:worker_threads';

parentPort.on( 'message', async ( { exclude, path } ) => {

  await fs_watch( path, exclude );
} );

async function not_excluded( path: string, exclude?: string[] ): Promise<boolean>{

  if( exclude !== undefined && exclude.length > 0 ){

    if( exclude.includes( path ) ){

      return false;
    }
  }

  return true;
}

async function fs_watch( path: string, exclude: string[] ): Promise<void>{

  const watcher = watch( path );
  for await ( const watcherEvent of watcher ) {

    if( await not_excluded( watcherEvent.filename, exclude ) ){

      if( watcherEvent.filename.at( watcherEvent.filename.length - 1 ) !== '~' ){

        parentPort.postMessage( { event: watcherEvent.eventType, filename: `${ path }/${watcherEvent.filename}` } );
      }
    }
  }
}

import type { CallBackArgvData, CallBackAsync } from '@ivy-industries/input';

import { watcher, watcher_setting } from '../../../watcher/index.js';

type WatchCallBackArgvData =
  CallBackArgvData<'directory' | 'file', string> &
  CallBackArgvData<'generic-event', boolean> &
  CallBackArgvData<'exclude', string[]>;

export const watch_cb: CallBackAsync = async ( data: WatchCallBackArgvData ): Promise<void> => {

  const path = data.get( 'directory' ) || data.get( 'file' ) || process.cwd();
  watcher_setting.set( 'path', path );

  const watch = await watcher( path, {
    disable_integrity: data.get( 'generic-event' ) || false,
    exclude: data.get( 'exclude' ) || []
  } );

  watch.on( 'ready', async ( integrity ) => {
    console.log( 'ready', integrity );
  } );

  watch.on( 'all', async ( filename ) => {
    console.log( 'all', filename );
  } );

  watch.on( 'changed', async ( filename, integrityData ) => {
    console.log( 'changed', filename, integrityData.data.toString().red() );
  } );

  watch.on( 'created', async ( filename ) => {
    console.log( 'created', filename );
  } );

  watch.on( 'deleted', async ( filename ) => {
    console.log( 'deleted', filename );
  } );

  watch.on( 'moved', async ( filename ) => {
    console.log( 'moved', filename );
  } );
};

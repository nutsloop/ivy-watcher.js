import type { CallBackFlagAsync } from '@ivy-industries/input';

import { Path } from '@ivy-industries/cross-path';

const p = new Path( import.meta.url );
export const directory_cb: CallBackFlagAsync = async ( path: string ): Promise<string> => {

  return p.isValid( path ).catch( ( error ) => {
    throw error;
  } );
};

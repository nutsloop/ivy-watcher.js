import type { CallBackFlagAsync } from '@nutsloop/ivy-input';

import { Path } from '@nutsloop/ivy-cross-path';

const p = new Path( import.meta.url );
export const directory_cb: CallBackFlagAsync = async ( path: string ): Promise<string> => {

  return p.isValid( path ).catch( ( error ) => {
    throw error;
  } );
};

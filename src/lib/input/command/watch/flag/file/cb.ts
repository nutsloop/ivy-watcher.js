import type { CallBackFlagAsync } from '@nutsloop/ivy-input';

import { Path } from '@ivy-industries/cross-path';

const p = new Path( import.meta.url );
export const file_cb: CallBackFlagAsync = async ( path: string ): Promise<string> => {

  return path !== undefined
    ? p.isFile( path ).catch( ( error ) => {
      throw error;
    } )
    : `${process.cwd()}/index.js`;
};

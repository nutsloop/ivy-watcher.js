import { Path } from '@ivy-industries/cross-path';

const p = new Path();

export async function foundFile( path: string ): Promise<boolean>{

  return p.isFile( path ).then( () => true ).catch( () => false );
}

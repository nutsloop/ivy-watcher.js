import { Path } from '@ivy-industries/cross-path';

const p = new Path();

export async function foundDirectory( path: string ): Promise<boolean>{

  return p.isValid( path ).then( () => true ).catch( () => false );
}

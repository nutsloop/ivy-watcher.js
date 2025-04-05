import { Path } from '@nutsloop/ivy-cross-path';

const p = new Path();

export async function foundDirectory( path: string ): Promise<boolean>{

  return p.isValid( path ).then( () => true ).catch( () => false );
}

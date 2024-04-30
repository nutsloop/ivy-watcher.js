import { extends_proto } from '@ivy-industries/ansi';
import { Path } from '@ivy-industries/cross-path';
import { spawn } from 'node:child_process';
import { cp } from 'node:fs/promises';

extends_proto();

async function compile_rust_crc(): Promise<void> {

  const path = new Path( import.meta.url );
  const cargo = spawn( 'cargo', [ '-V' ] );

  cargo.on( 'error', () => {
    process.stderr.write( `call to cargo executable failed` );
    process.exit( 1 );
  } );

  cargo.on( 'spawn', () => {
    process.stderr.write( `call to cargo succeeds\n` );
  } );

  cargo.on( 'exit', async ( code ) => {

    if ( code !== 0 ) {
      process.stderr.write( `call to cargo executable failed` );
      process.exit( 1 );
    }

    const cargo_toml = `${path.resolve( path.__dirname, 'Cargo.toml' )}`;
    const cargo_toml_mv_path = `${path.resolve( path.__dirname, '..', 'Cargo.toml' )}`;

    const cp_succeeded = await cp( cargo_toml, cargo_toml_mv_path )
      .catch( ( error ) => {
        process.stderr.write( `${error.message}\n` );
        process.stderr.write( `cargo.toml failed to move to ${cargo_toml_mv_path}\n` );
        process.exit( 1 );
      } );

    if( cp_succeeded === undefined ){

      process.stdout.write( `file ${cargo_toml} moved to ${cargo_toml_mv_path}\n` );
      const cargo_artifact = spawn( 'npx', [
        'cargo-cp-artifact',
        '-a',
        'cdylib',
        'crc',
        'lib/rust/crc.node',
        '--',
        'cargo',
        'build',
        '--release',
        '--message-format=json-render-diagnostics'
      ] )
        .on( 'error', ( console.error ) );

      cargo_artifact.stderr
        .on( 'data', data => process.stdout.write( data ) );

      cargo_artifact.stdout
        .on( 'data', data => process.stdout.write( data ) );

      cargo_artifact.on( 'exit', ( code ) => {
        if ( code !== 0 ) {
          process.stderr.write( `call to cargo-cp-artifact failed` );
          process.exit( 1 );
        }
        process.stdout.write( `call to cargo-cp-artifact succeeds\n` );
        process.stdout.write( `call to cargo clean to remove the target directory\n` );

        const cargo_clean = spawn( 'cargo', [ 'clean' ] );

        cargo_clean.on( 'error', () => {
          process.stderr.write( `call to cargo clean failed` );
          process.exit( 1 );
        } );

        cargo_clean.on( 'exit', ( code ) => {
          if ( code !== 0 ) {
            process.stderr.write( `call to cargo clean failed` );
            process.exit( 1 );
          }
          process.stdout.write( `call to cargo clean succeeds\n` );
          process.exit( 0 );
        } );

        cargo_clean.stderr.on( 'data', ( data ) => {
          process.stderr.write( data );
        } );

        cargo_clean.stdout.on( 'data', ( data ) => {
          process.stdout.write( data );
        } );

      } );
    }
  } );
}

await compile_rust_crc();

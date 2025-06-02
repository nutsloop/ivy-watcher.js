import { set_cli_info_specification } from '@nutsloop/ivy-input';

import { watch } from './command/watch/index.js';

/**
 * <u>Defines the server CLI and sets all the defined commands and flags</u>.
 */
export async function definition(): Promise<void> {

  // todo: set the global specification version for every commit
  set_cli_info_specification( {
    description: 'ivy watcher',
    github: 'https://github.com/nutsloop/ivy-watcher.js',
    name: 'ivy-watcher',
    npmjs: 'https://www.npmjs.com/package/@nutsloop/ivy-watcher',
    usage: 'ivy-watcher <command> [--flag=[options]]',
    version: '1.2.0-alpha.0',
    website: 'https://github.com/sponsors/nutsloop'
  } );

  await watch();
}

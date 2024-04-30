import { set_cli_info_specification } from '@ivy-industries/input';

import { watch } from './command/watch/index.js';

/**
 * <u>Defines the server CLI and sets all the defined commands and flags</u>.
 */
export async function definition(): Promise<void> {

  // todo: set the global specification version for every commit
  set_cli_info_specification( {
    description: 'ivy watcher',
    github: 'https://github.com/ivy-industries/watcher',
    name: 'ivy-watcher',
    npmjs: 'https://www.npmjs.com/package/@ivy-industries/watcher',
    usage: 'ivy-watcher <command> [--flag=[options]]',
    version: '1.0.0-alpha.1',
    website: 'https://watcher.ivy.run'
  } );

  await watch();
}

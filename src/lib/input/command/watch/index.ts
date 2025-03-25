import { command, flag } from '@nutsloop/ivy-input';

import { watch_cb } from './cb.js';
import { directory_cb } from './flag/directory/cb.js';
import { exclude_cb } from './flag/exclude/cb.js';
import { file_cb } from './flag/file/cb.js';
import { generic_event } from './flag/generic-event/cb.js';

export async function watch(): Promise<void>{

  await command( [ 'watch' ], {
    cb: watch_cb,
    description: 'Watch for changes',
    has_flag: true,
    usage: 'ivy-watcher watch'
  } );

  await flag( [ '--file', '-f' ], {
    alias: 'file',
    cb: {
      fn: file_cb,
      type: 'async'
    },
    description: 'Watch for changes of specific file',
    has_conflict: [ '--directory', '-d' ],
    is_flag_of: [ 'watch' ],
    multi_type: [ 'string', 'void' ],
    usage: 'ivy-watcher watch --file=[file]'
  } );

  await flag( [ '--directory', '-d' ], {
    alias: 'directory',
    cb: {
      fn: directory_cb,
      type: 'async'
    },
    description: 'Watch for changes of specific directory',
    is_flag_of: [ 'watch' ],
    type: 'string',
    usage: 'ivy-watcher watch --directory=[directory]'
  } );

  await flag( [ '--exclude', '-e' ], {
    alias: 'exclude',
    cb: {
      fn: exclude_cb,
      type: 'sync'
    },
    description: 'Exclude specific file or directory from being watched, comma separated',
    is_flag_of: [ 'watch' ],
    type: 'array',
    usage: 'ivy-watcher watch --exclude=[file|directory]'
  } );

  await flag( [ '--generic-event', '-a' ], {
    alias: 'generic-event',
    cb: {
      fn: generic_event,
      type: 'sync'
    },
    description: 'Generically watch for all events, disabling integrity check',
    is_flag_of: [ 'watch' ],
    type: 'void',
    usage: 'ivy-watcher watch --generic-event'
  } );
}

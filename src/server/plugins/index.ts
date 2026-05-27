import { Plugin } from './types';
import { esxPlugin } from './esx';
import { oxLibPlugin } from './oxlib';
import { oxMysqlPlugin } from './oxmysql';

/**
 * To add a plugin:
 *   1. Create `src/server/plugins/<name>/index.ts` exporting a `Plugin`.
 *   2. Add it to this array.
 * The loader handles detection, opt-out via convar (agent_api_plugin_<name>_enabled),
 * tool registration, and status logging.
 */
export const ALL_PLUGINS: Plugin[] = [esxPlugin, oxLibPlugin, oxMysqlPlugin];

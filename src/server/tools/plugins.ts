import { z } from 'zod';
import { ok } from '../util/envelope';
import { register } from './registry';
import { PluginStatus } from '../plugins/types';

let snapshotRef: PluginStatus[] = [];

export function setPluginSnapshot(snapshot: PluginStatus[]): void {
  snapshotRef = snapshot;
}

export function registerListPlugins(): void {
  register({
    name: 'list_plugins',
    description: 'Show which framework plugins (ESX, ox_lib, oxmysql, ...) are enabled.',
    input: z.object({}).strict(),
    handler: async () => ok({ plugins: snapshotRef }),
  });
}

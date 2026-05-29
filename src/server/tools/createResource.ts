import { CreateResourceInput, createResource } from '../fs/create';
import { GLOBAL_LOCK, withLock } from '../runtime/locks';
import { register } from './registry';
import { ToolContext } from './context';
import { ensureSession } from '../dashboard/tasks';

export function registerCreateResource(): void {
  register({
    name: 'create_resource',
    description:
      'Scaffold a new FiveM resource (fxmanifest.lua, server.lua, README.md) inside one of ' +
      'the configured write roots. Does not auto-refresh; call refresh_resources separately.',
    input: CreateResourceInput,
    handler: async (input, ctx: ToolContext) => {
      const name = (input as CreateResourceInput).name;
      const key = name || GLOBAL_LOCK;
      const result = await withLock(key, () =>
        createResource(input as CreateResourceInput, {
          writeRoots: ctx.convars.writeRoots,
          readonly: ctx.convars.readonly,
        }),
      );
      // Open a work session for the new resource so the dashboard tracks it.
      if (result.ok && name) ensureSession(name, `Scaffolded resource ${name}`);
      return result;
    },
  });
}

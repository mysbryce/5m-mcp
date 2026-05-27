import { CreateResourceInput, createResource } from '../fs/create';
import { GLOBAL_LOCK, withLock } from '../runtime/locks';
import { register } from './registry';
import { ToolContext } from './context';

export function registerCreateResource(): void {
  register({
    name: 'create_resource',
    description:
      'Scaffold a new FiveM resource (fxmanifest.lua, server.lua, README.md) inside one of ' +
      'the configured write roots. Does not auto-refresh; call refresh_resources separately.',
    input: CreateResourceInput,
    handler: async (input, ctx: ToolContext) => {
      const key = (input as CreateResourceInput).name || GLOBAL_LOCK;
      return withLock(key, () =>
        createResource(input as CreateResourceInput, {
          writeRoots: ctx.convars.writeRoots,
          readonly: ctx.convars.readonly,
        }),
      );
    },
  });
}

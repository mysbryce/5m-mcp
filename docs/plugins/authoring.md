# Write your own plugin

A plugin is a single TypeScript file. Three things:

1. Create `src/server/plugins/<name>/index.ts` exporting a `Plugin`.
2. Push it into `ALL_PLUGINS` in `src/server/plugins/index.ts`.
3. `npm run build && restart agent_api`.

The loader handles detection, opt-out convar, status logging, and the `list_plugins` snapshot. You don't touch any other file.

## Skeleton

```ts
import { z } from 'zod';
import { err, ok } from '../../util/envelope';
import { Plugin } from '../types';
import { isResourceStarted, safeExport } from '../helpers';
import { csvSet, isAllowed, listCallable, safeSerialize } from '../dynamic';

const RESOURCE = 'qb-core'; // the resource you depend on

type QbCore = Record<string, unknown> & {
  Functions: { GetPlayer: (src: number) => unknown };
};

let cached: QbCore | null = null;
function getQb(): QbCore | null {
  if (cached) return cached;
  const obj = safeExport<() => QbCore>(RESOURCE, 'GetCoreObject');
  if (obj) cached = obj();
  return cached;
}

export const qbcorePlugin: Plugin = {
  name: 'qbcore',
  description: 'QBCore framework — players, jobs, money, items.',
  detect: () => {
    const started = isResourceStarted(RESOURCE);
    if (!started.ok) return started;
    if (!safeExport(RESOURCE, 'GetCoreObject')) {
      return { ok: false, reason: `${RESOURCE} missing GetCoreObject export` };
    }
    return { ok: true };
  },
  install: ({ register, convars }) => {
    register({
      name: 'qbcore_get_player',
      description: 'Fetch one QBCore player snapshot.',
      input: z.object({ serverId: z.number().int().min(1) }).strict(),
      handler: async (input: { serverId: number }) => {
        const qb = getQb();
        if (!qb) return err('INTERNAL', 'QBCore not loaded.');
        const p = qb.Functions.GetPlayer(input.serverId);
        if (!p) return err('PLAYER_NOT_FOUND', `serverId ${input.serverId} not found.`);
        return ok(safeSerialize(p));
      },
    });

    // Reflective dispatcher: expose every method on the player object.
    const blocklist = csvSet('agent_api_plugin_qbcore_blocked_methods');

    register({
      name: 'qbcore_call_player',
      description: 'Reflective call on a QBCore player object.',
      input: z
        .object({
          serverId: z.number().int().min(1),
          method: z.string().regex(/^[a-zA-Z_][a-zA-Z0-9_.]*$/),
          args: z.array(z.unknown()).optional(),
        })
        .strict(),
      handler: async (input) => {
        const qb = getQb();
        if (!qb) return err('INTERNAL', 'QBCore not loaded.');
        const player = qb.Functions.GetPlayer(input.serverId) as Record<string, unknown> | null;
        if (!player) return err('PLAYER_NOT_FOUND', `serverId ${input.serverId} not found.`);

        const guard = isAllowed(input.method.split('.').at(-1)!, {
          readonly: convars.readonly,
          blocklist,
        });
        if (!guard.ok) return err('COMMAND_NOT_ALLOWED', guard.reason);

        // resolve dotted path
        let target: unknown = player;
        const parts = input.method.split('.');
        for (let i = 0; i < parts.length - 1; i++) {
          target = (target as Record<string, unknown>)[parts[i]!];
        }
        const fn = (target as Record<string, unknown>)[parts.at(-1)!];
        if (typeof fn !== 'function') {
          return err('INVALID_INPUT', `${input.method} is not callable.`);
        }
        const raw = await Promise.resolve(
          (fn as Function).apply(target, input.args ?? []),
        );
        return ok({ method: input.method, result: safeSerialize(raw) });
      },
    });

    void listCallable; // optional, if you add a `_list_methods` tool
  },
};
```

## Register it

```ts
// src/server/plugins/index.ts
import { qbcorePlugin } from './qbcore';

export const ALL_PLUGINS: Plugin[] = [
  esxPlugin,
  oxLibPlugin,
  oxMysqlPlugin,
  qbcorePlugin,   // ← here
];
```

## Naming conventions

- Plugin `name` is also the convar prefix: `agent_api_plugin_<name>_enabled`.
- Tool names start with `<plugin>_` so the catalog stays grouped.
- Mutating tools must respect `convars.readonly` and any per-plugin blocklist convar.
- Add a `<plugin>_list_methods` tool whenever you ship a reflective dispatcher — the agent needs discovery, not just dispatch.

## Test it

1. `npm run build`
2. `restart agent_api`
3. Look for `[agent_api] plugin enabled : qbcore` in console.
4. Call `list_plugins` to confirm tool names.
5. Add probes to `scripts/smoke.mjs`.

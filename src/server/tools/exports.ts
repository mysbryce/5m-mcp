import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import { err, ok } from '../util/envelope';
import { register } from './registry';
import { ToolContext } from './context';
import { getResourceInfo } from '../runtime/resources';
import { classifyMethod, csvSet, isAllowed, listCallable, safeSerialize } from '../plugins/dynamic';

// NB: in the CJS bundle, the module-local `exports` shadows FiveM's global, so
// the resource-export global must be read off globalThis.
type FxExports = Record<string, Record<string, unknown> | undefined>;
function fxExports(): FxExports | undefined {
  return (globalThis as { exports?: FxExports }).exports;
}

function collectManifest(text: string, keys: string[]): string[] {
  const out = new Set<string>();
  for (const key of keys) {
    const re = new RegExp(`(?:^|\\n)\\s*${key}\\b`, 'g');
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const rest = text.slice(m.index + m[0].length);
      const brace = rest.match(/^\s*\{([\s\S]*?)\}/);
      if (brace) {
        for (const s of brace[1]!.matchAll(/['"`]([^'"`]+)['"`]/g)) out.add(s[1]!);
      } else {
        const one = rest.match(/^\s*['"`]([^'"`]+)['"`]/);
        if (one) out.add(one[1]!);
      }
    }
  }
  return [...out];
}

function blocklist(): Set<string> {
  return csvSet('agent_api_export_blocked_methods');
}

export function registerExportTools(): void {
  register({
    name: 'list_exports',
    description:
      "List a resource's exports. Returns the server/client exports declared in its " +
      'fxmanifest plus any runtime-enumerable server exports. Note: exports registered at ' +
      'runtime via exports() may not all be listable — call_export still works on them by name.',
    input: z.object({ resource: z.string().min(1) }).strict(),
    handler: async (input: { resource: string }) => {
      const info = getResourceInfo(input.resource);
      if (!info) return err('RESOURCE_NOT_FOUND', `Resource not found: ${input.resource}`);

      let manifestServer: string[] = [];
      let manifestShared: string[] = [];
      for (const file of ['fxmanifest.lua', '__resource.lua']) {
        const abs = join(info.path, file);
        if (!existsSync(abs)) continue;
        try {
          const text = readFileSync(abs, 'utf8');
          manifestServer = collectManifest(text, ['server_export', 'server_exports']);
          manifestShared = collectManifest(text, ['export', 'exports']);
        } catch {
          // ignore
        }
        break;
      }

      let runtime: string[] = [];
      try {
        runtime = listCallable(fxExports()?.[input.resource]);
      } catch {
        runtime = [];
      }

      return ok({
        resource: input.resource,
        serverExports: manifestServer,
        sharedExports: manifestShared,
        runtimeCallable: runtime,
        hint: 'Call any of these with call_export({ resource, name, args }).',
      });
    },
  });

  register({
    name: 'call_export',
    description:
      'Invoke a server export of any started resource: exports[resource][name](...args). ' +
      'Read-verb gate applies (Get/Is/Has/List/... always allowed; mutating verbs need ' +
      'agent_api_readonly=false), plus the agent_api_export_blocked_methods blocklist. Use ' +
      'list_exports to discover names.',
    input: z
      .object({
        resource: z.string().min(1),
        name: z.string().min(1),
        args: z.array(z.unknown()).max(32).optional(),
      })
      .strict(),
    handler: async (
      input: { resource: string; name: string; args?: unknown[] },
      ctx: ToolContext,
    ) => {
      const gate = isAllowed(input.name, {
        readonly: ctx.convars.readonly,
        blocklist: blocklist(),
      });
      if (!gate.ok) return err('COMMAND_NOT_ALLOWED', gate.reason);

      const target = fxExports()?.[input.resource];
      if (!target) {
        return err('RESOURCE_NOT_FOUND', `No exports for resource: ${input.resource}`);
      }
      const fn = (target as Record<string, unknown>)[input.name];
      if (typeof fn !== 'function') {
        return err('NOT_FOUND', `Export not found: ${input.resource}.${input.name}`);
      }

      try {
        const result = await (fn as (...a: unknown[]) => unknown)(...(input.args ?? []));
        return ok({
          resource: input.resource,
          name: input.name,
          classification: classifyMethod(input.name),
          result: safeSerialize(result),
        });
      } catch (e) {
        return err('INTERNAL', e instanceof Error ? e.message : String(e));
      }
    },
  });
}

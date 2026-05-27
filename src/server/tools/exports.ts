import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
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

const EXPORT_CALL_RE = /\bexports\(\s*['"]([A-Za-z_]\w*)['"]/g;
const SCAN_SKIP = new Set(['node_modules', '.git', 'dist', 'build', 'out', 'vendor', '.svn']);

/** Scan a resource's Lua/JS source for runtime-registered `exports('name', fn)`. */
function scanSourceExports(root: string): string[] {
  const names = new Set<string>();
  const stack = [root];
  let scanned = 0;
  while (stack.length > 0 && scanned < 300) {
    const dir = stack.pop();
    if (dir === undefined) break;
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      continue;
    }
    for (const name of entries) {
      const full = join(dir, name);
      let isDir = false;
      let size = 0;
      try {
        const s = statSync(full);
        isDir = s.isDirectory();
        size = s.size;
      } catch {
        continue;
      }
      if (isDir) {
        if (!name.startsWith('.') && !SCAN_SKIP.has(name.toLowerCase())) stack.push(full);
      } else if (/\.(lua|js|ts)$/i.test(name) && size <= 512 * 1024) {
        scanned++;
        try {
          const text = readFileSync(full, 'utf8');
          for (const m of text.matchAll(EXPORT_CALL_RE)) names.add(m[1]!);
        } catch {
          // ignore unreadable file
        }
      }
    }
  }
  return [...names].sort();
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

      // Modern resources register exports at runtime via exports('name', fn) —
      // those aren't in the manifest nor enumerable on the proxy, so grep source.
      const source = scanSourceExports(info.path);

      return ok({
        resource: input.resource,
        serverExports: manifestServer,
        sharedExports: manifestShared,
        runtimeCallable: runtime,
        sourceExports: source,
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
      if (!getResourceInfo(input.resource)) {
        return err('RESOURCE_NOT_FOUND', `Resource not found: ${input.resource}`);
      }

      const gate = isAllowed(input.name, {
        readonly: ctx.convars.readonly,
        blocklist: blocklist(),
      });
      if (!gate.ok) return err('COMMAND_NOT_ALLOWED', gate.reason);

      // The exports proxy throws "No such export" on access of an unknown name,
      // so the lookup itself must be guarded — surface it as NOT_FOUND.
      let fn: unknown;
      try {
        fn = (fxExports()?.[input.resource] as Record<string, unknown> | undefined)?.[input.name];
      } catch {
        return err('NOT_FOUND', `Export not found: ${input.resource}.${input.name}`);
      }
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

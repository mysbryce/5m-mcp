import { z } from 'zod';
import { Envelope, err, ok } from '../util/envelope';
import { register } from './registry';
import { ToolContext } from './context';
import { csvSet, safeSerialize } from '../plugins/dynamic';

const READ_PREFIXES = ['Get', 'Has', 'Is', 'Does', 'Can', 'Will', 'Network'];

const DEFAULT_DANGER_BLOCKLIST = new Set([
  'DropPlayer',
  'ExecuteCommand',
  'StopResource',
  'StartResource',
  'ScheduleResourceTick',
  'PrintStructuredTrace',
  'CancelEvent',
  'TempBanPlayer',
  'BanPlayer',
]);

function isReadOnlyNative(name: string): boolean {
  return READ_PREFIXES.some((p) => name.startsWith(p));
}

const NativeInput = z
  .object({
    native: z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/),
    args: z.array(z.unknown()).max(32).optional(),
  })
  .strict();
type NativeInput = z.infer<typeof NativeInput>;

const ListInput = z
  .object({
    prefix: z.string().optional(),
    limit: z.number().int().min(1).max(2000).optional(),
  })
  .strict();
type ListInput = z.infer<typeof ListInput>;

function callOnServer(
  native: string,
  args: unknown[],
  ctx: { readonly: boolean; blocklist: Set<string> },
): Envelope<unknown> {
  if (DEFAULT_DANGER_BLOCKLIST.has(native)) {
    return err(
      'COMMAND_NOT_ALLOWED',
      `server native ${native} is in the built-in danger list. ` +
        'To override, expose it through a dedicated tool with a narrower input schema.',
    );
  }
  if (ctx.blocklist.has(native)) {
    return err('COMMAND_NOT_ALLOWED', `server native ${native} is in the blocklist.`);
  }
  if (ctx.readonly && !isReadOnlyNative(native)) {
    return err(
      'COMMAND_NOT_ALLOWED',
      `readonly mode: ${native} does not start with Get/Has/Is/Does/Can/Will/Network.`,
    );
  }
  const fn = (globalThis as Record<string, unknown>)[native];
  if (typeof fn !== 'function') {
    return err('INVALID_INPUT', `server native ${native} not found in global scope.`);
  }
  try {
    const raw = (fn as (...a: unknown[]) => unknown)(...args);
    return ok({ native, args, result: safeSerialize(raw) });
  } catch (e) {
    return err('INTERNAL', e instanceof Error ? e.message : String(e));
  }
}

export function registerServerCallNative(): void {
  register({
    name: 'server_call_native',
    description:
      'Invoke ANY FiveM server-side native directly in the agent_api script context. ' +
      'No client round-trip; runs synchronously on the server. ' +
      'Read-only natives (prefix Get/Has/Is/Does/Can/Will/Network) always allowed. ' +
      'Mutating natives require agent_api_readonly=false. ' +
      'Block specific natives via agent_api_server_blocked_natives (csv).',
    input: NativeInput,
    handler: async (input: NativeInput, ctx: ToolContext) => {
      const blocklist = csvSet('agent_api_server_blocked_natives');
      return callOnServer(input.native, input.args ?? [], {
        readonly: ctx.convars.readonly,
        blocklist,
      });
    },
  });
}

export function registerServerListNatives(): void {
  register({
    name: 'server_list_natives',
    description:
      'Enumerate function names available in the server-side global scope. ' +
      'Filter by case-insensitive substring. Use before server_call_native to discover.',
    input: ListInput,
    handler: async (input: ListInput) => {
      const wanted = (input.prefix ?? '').toLowerCase();
      const max = Math.max(1, Math.min(2000, input.limit ?? 500));
      const names: string[] = [];
      for (const k of Object.keys(globalThis as object)) {
        if (typeof (globalThis as Record<string, unknown>)[k] !== 'function') continue;
        if (wanted && !k.toLowerCase().includes(wanted)) continue;
        names.push(k);
        if (names.length >= max) break;
      }
      return ok({ count: names.length, names: names.sort() });
    },
  });
}

import { z } from 'zod';
import { Envelope, err, ok } from '../util/envelope';
import { register } from './registry';
import { ToolContext } from './context';
import { getOptIn } from '../players/registry';
import { isSubject } from '../players/subjects';
import { callRemote } from '../players/probes';
import { csvSet } from '../plugins/dynamic';

const READ_PREFIXES = ['Get', 'Has', 'Is', 'Does', 'Can', 'Will', 'Network'];

function isReadOnlyNative(name: string): boolean {
  return READ_PREFIXES.some((p) => name.startsWith(p));
}

function ensureActiveSubject(serverId: number): Envelope<true> {
  if (!getOptIn(serverId)) {
    return err('PLAYER_NOT_OPTED_IN', `Player ${serverId} has not opted in.`);
  }
  if (!isSubject(serverId)) {
    return err(
      'PLAYER_NOT_OPTED_IN',
      `Player ${serverId} is opted in but not in the active subject pool.`,
    );
  }
  return ok(true);
}

const NativeInput = z
  .object({
    serverId: z.number().int().min(1),
    native: z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/),
    args: z.array(z.unknown()).max(32).optional(),
    timeoutMs: z.number().int().min(100).max(10000).optional(),
  })
  .strict();
type NativeInput = z.infer<typeof NativeInput>;

const ListInput = z
  .object({
    serverId: z.number().int().min(1),
    prefix: z.string().optional(),
    limit: z.number().int().min(1).max(2000).optional(),
    timeoutMs: z.number().int().min(100).max(10000).optional(),
  })
  .strict();
type ListInput = z.infer<typeof ListInput>;

export function registerClientCallNative(): void {
  register({
    name: 'client_call_native',
    description:
      'Invoke ANY FiveM client native on one registered test subject. ' +
      'Args support special tokens: "$ped" / "$player" / "$serverId" / "$vehicle" / ' +
      '"$lastVehicle" / "$coords" / "$heading" resolved client-side. ' +
      'Read-only natives (prefix Get/Has/Is/Does/Can/Will/Network) always allowed. ' +
      'Mutating natives need agent_api_readonly=false. ' +
      'Block specific natives via agent_api_client_blocked_natives (csv).',
    input: NativeInput,
    handler: async (input: NativeInput, ctx: ToolContext) => {
      const guard = ensureActiveSubject(input.serverId);
      if (!guard.ok) return guard;

      const blocklist = csvSet('agent_api_client_blocked_natives');
      if (blocklist.has(input.native)) {
        return err('COMMAND_NOT_ALLOWED', `native ${input.native} is in the blocklist.`);
      }
      if (ctx.convars.readonly && !isReadOnlyNative(input.native)) {
        return err(
          'COMMAND_NOT_ALLOWED',
          `readonly mode: ${input.native} does not start with Get/Has/Is/Does/Can/Will/Network.`,
        );
      }

      return callRemote(
        input.serverId,
        'agent_api:client_native',
        [input.native, input.args ?? []],
        input.timeoutMs ?? 3000,
        input.native,
      );
    },
  });
}

export function registerClientListNatives(): void {
  register({
    name: 'client_list_natives',
    description:
      'Enumerate function names available in client globalThis. Filter by case-insensitive ' +
      'prefix substring. Useful before client_call_native to discover what is callable.',
    input: ListInput,
    handler: async (input: ListInput) => {
      const guard = ensureActiveSubject(input.serverId);
      if (!guard.ok) return guard;

      return callRemote(
        input.serverId,
        'agent_api:client_native_list',
        [input.prefix ?? '', input.limit ?? 500],
        input.timeoutMs ?? 3000,
        'client_list_natives',
      );
    },
  });
}

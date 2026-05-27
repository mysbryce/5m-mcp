import { z } from 'zod';
import { Envelope, err, ok } from '../util/envelope';
import { register } from './registry';
import { ToolContext } from './context';
import { getOptIn, listOptedIn } from '../players/registry';
import { addSubject, isSubject, listSubjects, removeSubject } from '../players/subjects';
import { ProbeName, callProbe } from '../players/probes';
import { waitForClientEvent } from '../players/events';

const SubjectInput = z.object({ serverId: z.number().int().min(1) }).strict();

const ProbeNameSchema = z.enum(['entity_basic', 'ped_status', 'player_meta', 'inventory_snap']);

export function registerListPlayers(): void {
  register({
    name: 'list_players',
    description: 'List players who have opted in via /agent_test_optin (with TTL countdown).',
    input: z.object({}).strict(),
    handler: async () => {
      const now = Date.now();
      const opted = listOptedIn().map((s) => {
        const secondsLeft = Math.max(0, Math.floor((s.expiresAt - now) / 1000));
        return Object.assign({}, s, { secondsLeft, isActiveSubject: isSubject(s.serverId) });
      });
      return ok({
        optedIn: opted,
        activeSubjects: listSubjects(),
      });
    },
  });
}

export function registerRegisterTestSubject(): void {
  register({
    name: 'register_test_subject',
    description:
      'Move an opted-in player into the active test-subject pool. Limited by ' +
      'agent_api_test_max_subjects convar.',
    input: SubjectInput,
    handler: async (input: { serverId: number }, ctx: ToolContext) => {
      const res = addSubject(input.serverId, ctx.convars.testMaxSubjects);
      if (!res.ok) return res;
      const session = getOptIn(input.serverId)!;
      return ok({ subject: session });
    },
  });
}

export function registerUnregisterTestSubject(): void {
  register({
    name: 'unregister_test_subject',
    description: 'Remove a player from the active subject pool. Opt-in session is preserved.',
    input: SubjectInput,
    handler: async (input: { serverId: number }) => {
      const removed = removeSubject(input.serverId);
      return ok({ removed });
    },
  });
}

function ensureActiveSubject(serverId: number): Envelope<true> {
  if (!getOptIn(serverId)) {
    return err('PLAYER_NOT_OPTED_IN', `Player ${serverId} has not opted in.`);
  }
  if (!isSubject(serverId)) {
    return err(
      'PLAYER_NOT_OPTED_IN',
      `Player ${serverId} is opted in but not registered as an active subject. ` +
        'Call register_test_subject first.',
    );
  }
  return ok(true);
}

export function registerGetPlayerState(): void {
  register({
    name: 'get_player_state',
    description:
      'Run client-side probes on a registered test subject and return collected snapshots.',
    input: z
      .object({
        serverId: z.number().int().min(1),
        probes: z.array(ProbeNameSchema).min(1).optional(),
        timeoutMs: z.number().int().min(100).max(10000).optional(),
      })
      .strict(),
    handler: async (input: { serverId: number; probes?: ProbeName[]; timeoutMs?: number }) => {
      const guard = ensureActiveSubject(input.serverId);
      if (!guard.ok) return guard;
      const probes: ProbeName[] = input.probes ?? ['entity_basic', 'ped_status', 'player_meta'];
      const timeout = input.timeoutMs ?? 2000;
      const results: Record<string, unknown> = {};
      for (const probe of probes) {
        // oxlint-disable-next-line no-await-in-loop
        const r = await callProbe(input.serverId, probe, {}, timeout);
        results[probe] = r.ok ? { ok: true, data: r.data } : { ok: false, error: r.error };
      }
      return ok({ serverId: input.serverId, results });
    },
  });
}

export function registerTriggerClientEvent(): void {
  register({
    name: 'trigger_client_event',
    description:
      'Send an arbitrary net event to one registered test subject. The agent must already know ' +
      'what event the target resource expects.',
    input: z
      .object({
        serverId: z.number().int().min(1),
        event: z.string().min(1),
        args: z.array(z.unknown()).optional(),
      })
      .strict(),
    handler: async (input: { serverId: number; event: string; args?: unknown[] }) => {
      const guard = ensureActiveSubject(input.serverId);
      if (!guard.ok) return guard;
      emitNet(input.event, input.serverId, ...(input.args ?? []));
      return ok({ sent: { serverId: input.serverId, event: input.event, args: input.args ?? [] } });
    },
  });
}

export function registerSendChat(): void {
  register({
    name: 'send_chat',
    description: 'Push a single chat message to one registered test subject via chat:addMessage.',
    input: z
      .object({
        serverId: z.number().int().min(1),
        text: z.string().min(1).max(1024),
        color: z.tuple([z.number(), z.number(), z.number()]).optional(),
      })
      .strict(),
    handler: async (input: {
      serverId: number;
      text: string;
      color?: [number, number, number];
    }) => {
      const guard = ensureActiveSubject(input.serverId);
      if (!guard.ok) return guard;
      emitNet('chat:addMessage', input.serverId, {
        color: input.color ?? [180, 180, 240],
        args: ['[agent_api]', input.text],
      });
      return ok({ sent: true });
    },
  });
}

export function registerWaitForClientEvent(): void {
  register({
    name: 'wait_for_client_event',
    description:
      'Block until a matching client net event is received (optionally only from one subject) ' +
      'or the timeout elapses.',
    input: z
      .object({
        event: z.string().min(1),
        fromSubject: z.number().int().min(1).optional(),
        timeoutMs: z.number().int().min(100).max(60000).optional(),
      })
      .strict(),
    handler: async (input: { event: string; fromSubject?: number; timeoutMs?: number }) => {
      if (input.fromSubject !== undefined) {
        const guard = ensureActiveSubject(input.fromSubject);
        if (!guard.ok) return guard;
      }
      const result = await waitForClientEvent(
        input.event,
        input.timeoutMs ?? 5000,
        input.fromSubject,
      );
      if (!result) return err('TIMEOUT', `No matching ${input.event} within timeout.`);
      return ok(result);
    },
  });
}

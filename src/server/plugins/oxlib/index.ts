import { z } from 'zod';
import * as oxLibServer from '@overextended/ox_lib/server';
import { triggerClientCallback, versionCheck } from '@overextended/ox_lib/server';
import { Envelope, err, ok } from '../../util/envelope';
import { Plugin } from '../types';
import { isResourceStarted } from '../helpers';
import { csvSet, isAllowed, safeSerialize } from '../dynamic';

const RESOURCE = 'ox_lib';

const NotifyInput = z
  .object({
    serverId: z.number().int().min(1),
    title: z.string().min(1).max(120),
    description: z.string().max(2048).optional(),
    type: z.enum(['inform', 'success', 'warning', 'error']).optional(),
    duration: z.number().int().min(500).max(60000).optional(),
    position: z
      .enum([
        'top',
        'top-right',
        'top-left',
        'bottom',
        'bottom-right',
        'bottom-left',
        'center-right',
        'center-left',
      ])
      .optional(),
  })
  .strict();
type NotifyInput = z.infer<typeof NotifyInput>;

const CallbackInput = z
  .object({
    serverId: z.number().int().min(1),
    event: z.string().min(1),
    args: z.array(z.unknown()).optional(),
    timeoutMs: z.number().int().min(100).max(30000).optional(),
  })
  .strict();
type CallbackInput = z.infer<typeof CallbackInput>;

export const oxLibPlugin: Plugin = {
  name: 'oxlib',
  description: 'ox_lib bridge — notifications, client callbacks, version check.',
  detect: () => isResourceStarted(RESOURCE),
  install: ({ register, convars }) => {
    register({
      name: 'oxlib_notify',
      description: 'Trigger an ox_lib UI notification on one player.',
      input: NotifyInput,
      handler: async (input: NotifyInput) => {
        emitNet('ox_lib:notify', input.serverId, {
          title: input.title,
          description: input.description,
          type: input.type ?? 'inform',
          duration: input.duration,
          position: input.position,
        });
        return ok({ sent: true });
      },
    });

    register({
      name: 'oxlib_trigger_client_callback',
      description:
        'Round-trip call: trigger an ox_lib client callback on one player and return their reply.',
      input: CallbackInput,
      handler: async (input: CallbackInput) => {
        try {
          const timer = new Promise<symbol>((res) =>
            setTimeout(() => res(TIMEOUT_SYMBOL), input.timeoutMs ?? 5000),
          );
          const call = triggerClientCallback(
            input.event,
            input.serverId,
            ...(input.args ?? []),
          ) as Promise<unknown>;
          const result = await Promise.race([call, timer]);
          if (result === TIMEOUT_SYMBOL) {
            return err('TIMEOUT', `ox_lib callback ${input.event} timed out.`);
          }
          return ok({ result });
        } catch (e) {
          return err('INTERNAL', e instanceof Error ? e.message : String(e));
        }
      },
    });

    register({
      name: 'oxlib_check_dependency',
      description: 'Use ox_lib versionCheck to confirm a resource meets a minimum semver version.',
      input: z
        .object({
          resource: z.string().min(1),
          minVersion: z.string().min(1),
        })
        .strict(),
      handler: async (input: { resource: string; minVersion: string }) => {
        try {
          versionCheck(`${input.resource}@${input.minVersion}`);
          return ok({ checked: true });
        } catch (e) {
          return err('INTERNAL', e instanceof Error ? e.message : String(e));
        }
      },
    });

    register({
      name: 'oxlib_list_methods',
      description:
        'List every exported function from @overextended/ox_lib/server — use before oxlib_call.',
      input: z.object({}).strict(),
      handler: async () => {
        const fns: string[] = [];
        const ns: string[] = [];
        for (const k of Object.keys(oxLibServer)) {
          const v = (oxLibServer as Record<string, unknown>)[k];
          if (typeof v === 'function') fns.push(k);
          else if (v !== null && typeof v === 'object') ns.push(k);
        }
        return ok({ methods: fns.sort(), namespaces: ns.sort() });
      },
    });

    const blocklist = csvSet('agent_api_plugin_oxlib_blocked_methods');

    register({
      name: 'oxlib_call',
      description:
        'Call any exported function from @overextended/ox_lib/server dynamically. ' +
        'Pass a dotted path (e.g. "addAce" or "cache.serverId") and arguments. ' +
        'Read-only verbs always allowed; mutating verbs require agent_api_readonly=false.',
      input: z
        .object({
          path: z.string().regex(/^[a-zA-Z_][a-zA-Z0-9_.]*$/),
          args: z.array(z.unknown()).optional(),
        })
        .strict(),
      handler: async (input: { path: string; args?: unknown[] }): Promise<Envelope<unknown>> => {
        const parts = input.path.split('.');
        const leaf = parts.at(-1) ?? input.path;
        const guard = isAllowed(leaf, { readonly: convars.readonly, blocklist });
        if (!guard.ok) return err('COMMAND_NOT_ALLOWED', guard.reason);

        let target: unknown = oxLibServer;
        for (let i = 0; i < parts.length - 1; i++) {
          target = (target as Record<string, unknown>)[parts[i]!];
          if (target == null) {
            return err('INVALID_INPUT', `ox_lib path segment not found: ${parts[i]}`);
          }
        }
        const fnOrValue = (target as Record<string, unknown>)[leaf];
        if (typeof fnOrValue !== 'function') {
          return ok({ path: input.path, kind: 'value', value: safeSerialize(fnOrValue) });
        }
        try {
          const raw = await Promise.resolve(
            (fnOrValue as Function).apply(target, input.args ?? []),
          );
          return ok({ path: input.path, kind: 'call', result: safeSerialize(raw) });
        } catch (e) {
          return err('INTERNAL', e instanceof Error ? e.message : String(e));
        }
      },
    });
  },
};

const TIMEOUT_SYMBOL = Symbol('oxlib-callback-timeout');

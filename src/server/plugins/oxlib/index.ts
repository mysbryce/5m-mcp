import { z } from 'zod';
import { triggerClientCallback, versionCheck } from '@overextended/ox_lib/server';
import { err, ok } from '../../util/envelope';
import { Plugin } from '../types';
import { isResourceStarted } from '../helpers';

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
  install: ({ register }) => {
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
  },
};

const TIMEOUT_SYMBOL = Symbol('oxlib-callback-timeout');

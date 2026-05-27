import { z } from 'zod';
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

export const oxLibPlugin: Plugin = {
  name: 'oxlib',
  description: 'ox_lib bridge — UI notifications and server callbacks.',
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
      name: 'oxlib_resource_versions',
      description: 'List ox_lib detection info — useful as a connectivity probe.',
      input: z.object({}).strict(),
      handler: async () => {
        const state = GetResourceState(RESOURCE);
        if (state !== 'started') return err('INTERNAL', `ox_lib state: ${state}`);
        return ok({ resource: RESOURCE, state });
      },
    });
  },
};

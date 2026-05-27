import { z } from 'zod';
import { ok } from '../util/envelope';
import { listResources } from '../runtime/resources';
import { register } from './registry';

export function registerListResources(): void {
  register({
    name: 'list_resources',
    description: 'Enumerate all registered FiveM resources with their state.',
    input: z
      .object({
        filterState: z.string().optional(),
      })
      .strict(),
    handler: async (input: { filterState?: string }) => {
      const all = listResources();
      const filtered = input.filterState ? all.filter((r) => r.state === input.filterState) : all;
      return ok({ resources: filtered, count: filtered.length });
    },
  });
}

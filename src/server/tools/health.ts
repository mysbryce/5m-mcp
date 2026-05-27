import { z } from 'zod';
import { ok } from '../util/envelope';
import { register } from './registry';

export function registerHealth(version: string): void {
  register({
    name: 'health',
    description: 'Liveness probe. Returns version and uptime.',
    input: z.object({}).strict(),
    handler: async () =>
      ok({
        status: 'up',
        resource: GetCurrentResourceName(),
        version,
        uptimeMs: Math.floor(process.uptime() * 1000),
      }),
  });
}

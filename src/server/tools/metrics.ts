import { z } from 'zod';
import { ok } from '../util/envelope';
import { register } from './registry';
import { listResources } from '../runtime/resources';

declare const GetNumPlayerIndices: (() => number) | undefined;

export function registerServerMetrics(): void {
  register({
    name: 'server_metrics',
    description:
      'Snapshot of server/runtime health: uptime, online player count, resource counts by state, ' +
      'and the agent_api host process memory (rss / heap). Note: the FiveM runtime does not expose ' +
      'reliable per-resource CPU, so this is a server-level view.',
    input: z.object({}).strict(),
    handler: async () => {
      const resources = listResources();
      const byState: Record<string, number> = {};
      for (const r of resources) byState[r.state] = (byState[r.state] ?? 0) + 1;

      const mem = process.memoryUsage();
      let players: number | null = null;
      try {
        if (typeof GetNumPlayerIndices === 'function') players = GetNumPlayerIndices();
      } catch {
        players = null;
      }

      return ok({
        uptimeSeconds: Math.round(process.uptime()),
        players,
        resources: { total: resources.length, byState },
        hostMemory: {
          rssBytes: mem.rss,
          heapUsedBytes: mem.heapUsed,
          heapTotalBytes: mem.heapTotal,
        },
      });
    },
  });
}

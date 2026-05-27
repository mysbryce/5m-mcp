import { z } from 'zod';
import { ok } from '../util/envelope';
import { runRefresh } from '../runtime/refresh';
import { GLOBAL_LOCK, withLock } from '../runtime/locks';
import { register } from './registry';
import { ToolContext } from './context';

const Input = z
  .object({
    waitMs: z.number().int().min(0).max(5000).optional(),
  })
  .strict();
type Input = z.infer<typeof Input>;

const sleep = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));

export function registerRefreshResources(): void {
  register({
    name: 'refresh_resources',
    description:
      'Execute the FiveM `refresh` command so newly created folders are discovered. ' +
      'Returns console lines captured during the wait window.',
    input: Input,
    handler: async (input: Input, ctx: ToolContext) => {
      const wait = input.waitMs ?? 750;
      return withLock(GLOBAL_LOCK, async () => {
        const startIdx = ctx.console.length();
        await runRefresh();
        if (wait > 0) await sleep(wait);
        const lines = ctx.console.slice(startIdx);
        return ok({ lines, count: lines.length });
      });
    },
  });
}

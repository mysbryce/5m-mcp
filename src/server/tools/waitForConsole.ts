import { z } from 'zod';
import { Envelope, err, ok } from '../util/envelope';
import { escapeRegExp } from '../util/text';
import { register } from './registry';
import { ToolContext } from './context';
import { ConsoleLine } from '../console/buffer';

type WaitOutput = {
  matched: boolean;
  line: ConsoleLine | null;
  waitedMs: number;
  scanned: number;
};

const Input = z
  .object({
    pattern: z.string().min(1),
    timeoutMs: z.number().int().min(100).max(60000).optional(),
    channel: z.string().optional(),
    isRegex: z.boolean().optional(),
    ignoreCase: z.boolean().optional(),
    sinceTs: z.number().int().min(0).optional(),
  })
  .strict();
type Input = z.infer<typeof Input>;

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

export function registerWaitForConsole(): void {
  register({
    name: 'wait_for_console',
    description:
      'Block until a console line matching `pattern` appears, or until `timeoutMs` (default 5000). ' +
      'Call right after ensure_resource / restart_resource to detect a boot banner or an error ' +
      'without busy-polling tail_console. Substring by default; set isRegex:true for a regex. ' +
      'Only scans lines logged after the call (override with sinceTs). Returns matched:false on ' +
      'timeout — that is a normal result, not an error.',
    input: Input,
    handler: async (input: Input, ctx: ToolContext): Promise<Envelope<WaitOutput>> => {
      const flags = input.ignoreCase ? 'i' : '';
      let matcher: RegExp;
      try {
        matcher = new RegExp(input.isRegex ? input.pattern : escapeRegExp(input.pattern), flags);
      } catch (e) {
        return err('INVALID_INPUT', `Invalid regex: ${e instanceof Error ? e.message : String(e)}`);
      }

      const start = Date.now();
      const since = input.sinceTs ?? start;
      const timeout = input.timeoutMs ?? 5000;
      const deadline = start + timeout;
      const tailOpts: { sinceTs: number; channel?: string } = { sinceTs: since };
      if (input.channel !== undefined) tailOpts.channel = input.channel;

      for (;;) {
        const lines = ctx.console.tail(tailOpts);
        const hit = lines.find((l) => matcher.test(l.message));
        if (hit) {
          return ok({
            matched: true,
            line: hit,
            waitedMs: Date.now() - start,
            scanned: lines.length,
          });
        }
        if (Date.now() >= deadline) {
          return ok({ matched: false, line: null, waitedMs: timeout, scanned: lines.length });
        }
        await sleep(150);
      }
    },
  });
}

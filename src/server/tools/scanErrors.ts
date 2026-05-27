import { z } from 'zod';
import { ok } from '../util/envelope';
import { register } from './registry';
import { ToolContext } from './context';

const ERROR_SIGNAL =
  /SCRIPT ERROR|stack traceback|unhandled rejection|^error:|^uncaught|attempt to (?:call|index|perform|concatenate|compare)|\bTypeError\b|\bReferenceError\b|\bSyntaxError\b/i;

// Capture FiveM-style source refs: @resource/path/file.lua:123  or  path/file.js:12
const FRAME_RE = /@?([\w.-]+)\/([\w./-]+\.(?:lua|js|ts)):(\d+)/g;

type Frame = { resource: string; file: string; line: number };

const Input = z
  .object({
    sinceTs: z.number().int().min(0).optional(),
    resource: z.string().optional(),
    max: z.number().int().min(1).max(200).optional(),
  })
  .strict();
type Input = z.infer<typeof Input>;

export function registerScanErrors(): void {
  register({
    name: 'scan_errors',
    description:
      'Scan the console ring buffer for error lines (FiveM SCRIPT ERROR, Lua tracebacks, JS ' +
      'exceptions) and return them structured: timestamp, channel, message, and parsed ' +
      '{resource,file,line} frames. Filter by `resource` or `sinceTs`. Pair with ensure/restart ' +
      'to pinpoint what broke without eyeballing raw logs.',
    input: Input,
    handler: async (input: Input, ctx: ToolContext) => {
      const tailOpts: { sinceTs?: number } = {};
      if (input.sinceTs !== undefined) tailOpts.sinceTs = input.sinceTs;
      const lines = ctx.console.tail(tailOpts);
      const max = input.max ?? 50;
      const filter = input.resource;

      const errors: Array<{ ts: number; channel: string; message: string; frames: Frame[] }> = [];
      for (const l of lines) {
        if (errors.length >= max) break;
        if (!ERROR_SIGNAL.test(l.message)) continue;
        const frames: Frame[] = [...l.message.matchAll(FRAME_RE)].map((m) => ({
          resource: m[1]!,
          file: m[2]!,
          line: Number(m[3]),
        }));
        if (
          filter &&
          !l.message.includes(filter) &&
          l.channel !== `script:${filter}` &&
          !frames.some((f) => f.resource === filter)
        ) {
          continue;
        }
        errors.push({
          ts: l.ts,
          channel: l.channel,
          message: l.message.slice(0, 600),
          frames,
        });
      }

      return ok({ errors, count: errors.length, scanned: lines.length });
    },
  });
}

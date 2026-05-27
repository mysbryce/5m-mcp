import { z } from 'zod';
import { Envelope, ok } from '../util/envelope';
import { captureAround } from '../runtime/capture';
import { parseAllowedCommand, runConsole } from '../runtime/command';
import { LifecycleVerb, runLifecycle } from '../runtime/lifecycle';
import { GLOBAL_LOCK, withLock } from '../runtime/locks';
import { register } from './registry';
import { ToolContext } from './context';

const Input = z
  .object({
    command: z.string().min(1),
    waitMs: z.number().int().min(0).max(5000).optional(),
    timeoutMs: z.number().int().min(100).max(30000).optional(),
  })
  .strict();
type Input = z.infer<typeof Input>;

export function registerRunCommand(): void {
  register({
    name: 'run_command',
    description:
      'Run a console command from the allowlist (refresh, ensure/start/stop/restart <name>, ' +
      'status, players, say <text>). Returns captured console lines and, for lifecycle verbs, ' +
      'a structured state-before/after envelope.',
    input: Input,
    handler: async (input: Input, ctx: ToolContext): Promise<Envelope<unknown>> => {
      const parsed = parseAllowedCommand(input.command);
      if (!parsed.ok) return parsed;

      const cmd = parsed.data;

      if (cmd.kind === 'resource') {
        return withLock(cmd.resource, () =>
          runLifecycle(cmd.verb as LifecycleVerb, cmd.resource, {
            console: ctx.console,
            controlRoots: ctx.convars.controlRoots,
            ...(input.timeoutMs !== undefined ? { timeoutMs: input.timeoutMs } : {}),
          }),
        );
      }

      const wait = input.waitMs ?? 1000;
      const literal = cmd.kind === 'no_arg' ? cmd.verb : `${cmd.verb} ${cmd.text}`;

      return withLock(GLOBAL_LOCK, async () => {
        const capture = await captureAround(ctx.console, () => runConsole(literal), {
          delayMs: wait,
        });
        return ok({
          command: literal,
          lines: capture.lines,
          count: capture.lines.length,
        });
      });
    },
  });
}

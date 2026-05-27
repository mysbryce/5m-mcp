import { z } from 'zod';
import { withLock } from '../runtime/locks';
import { LifecycleVerb, runLifecycle } from '../runtime/lifecycle';
import { register } from './registry';
import { ToolContext } from './context';

const Input = z
  .object({
    name: z.string().min(1),
    timeoutMs: z.number().int().min(100).max(30000).optional(),
  })
  .strict();
type Input = z.infer<typeof Input>;

function registerLifecycle(toolName: string, verb: LifecycleVerb, description: string): void {
  register({
    name: toolName,
    description,
    input: Input,
    handler: async (input: Input, ctx: ToolContext) =>
      withLock(input.name, () =>
        runLifecycle(verb, input.name, {
          console: ctx.console,
          controlRoots: ctx.convars.controlRoots,
          ...(input.timeoutMs !== undefined ? { timeoutMs: input.timeoutMs } : {}),
        }),
      ),
  });
}

export function registerEnsureResource(): void {
  registerLifecycle(
    'ensure_resource',
    'ensure',
    'Run the FiveM `ensure` command for a resource and wait until it reaches state `started`. ' +
      'Returns state-before/after and console lines captured during the wait.',
  );
}

export function registerStartResource(): void {
  registerLifecycle(
    'start_resource',
    'start',
    'Start a stopped resource and wait until state == `started`.',
  );
}

export function registerStopResource(): void {
  registerLifecycle(
    'stop_resource',
    'stop',
    'Stop a started resource and wait until state == `stopped`.',
  );
}

export function registerRestartResource(): void {
  registerLifecycle(
    'restart_resource',
    'restart',
    'Restart a resource and wait until state == `started`.',
  );
}

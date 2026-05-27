import { Envelope, err, ok } from '../util/envelope';
import { ConsoleLine, RingBuffer } from '../console/buffer';
import { captureAround } from './capture';
import { runConsole } from './command';
import { getResourceInfo } from './resources';
import { pathWithinAnyRoot } from '../fs/sandbox';

export type LifecycleVerb = 'ensure' | 'start' | 'stop' | 'restart';

const EXPECTED_STATE: Record<LifecycleVerb, string> = {
  ensure: 'started',
  start: 'started',
  stop: 'stopped',
  restart: 'started',
};

export type LifecycleResult = {
  resource: string;
  verb: LifecycleVerb;
  stateBefore: string;
  stateAfter: string;
  expectedState: string;
  reachedExpectedState: boolean;
  lines: ConsoleLine[];
};

export async function runLifecycle(
  verb: LifecycleVerb,
  resource: string,
  ctx: { console: RingBuffer; controlRoots: string[]; timeoutMs?: number },
): Promise<Envelope<LifecycleResult>> {
  const info = getResourceInfo(resource);
  if (!info) {
    return err('RESOURCE_NOT_FOUND', `Resource not found: ${resource}`);
  }
  if (!pathWithinAnyRoot(info.path, ctx.controlRoots)) {
    return err('COMMAND_NOT_ALLOWED', 'Resource is not within any configured control root.', {
      resource,
      controlRoots: ctx.controlRoots,
    });
  }

  const expected = EXPECTED_STATE[verb];
  const stateBefore = info.state;

  const capture = await captureAround(ctx.console, () => runConsole(`${verb} ${resource}`), {
    waitForState: { name: resource, expect: expected },
    timeoutMs: ctx.timeoutMs ?? 3000,
  });

  const stateAfter = GetResourceState(resource);
  const reached = capture.reachedExpectedState ?? false;

  const data: LifecycleResult = {
    resource,
    verb,
    stateBefore,
    stateAfter,
    expectedState: expected,
    reachedExpectedState: reached,
    lines: capture.lines,
  };

  if (!reached) {
    return err('RESOURCE_FAILED_TO_START', `${verb} ${resource} did not reach state ${expected}.`, {
      ...data,
    });
  }
  return ok(data);
}

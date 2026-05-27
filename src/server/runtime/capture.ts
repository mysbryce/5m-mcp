import { ConsoleLine, RingBuffer } from '../console/buffer';

const POLL_INTERVAL_MS = 50;

const sleep = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));

export type CaptureOpts =
  | { waitForState: { name: string; expect: string }; timeoutMs?: number }
  | { delayMs: number };

async function waitUntil(predicate: () => boolean, timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) return true;
    // oxlint-disable-next-line no-await-in-loop
    await sleep(POLL_INTERVAL_MS);
  }
  return predicate();
}

export type CaptureResult<T> = {
  result: T;
  lines: ConsoleLine[];
  reachedExpectedState: boolean | null;
};

export async function captureAround<T>(
  buffer: RingBuffer,
  fn: () => T | Promise<T>,
  opts: CaptureOpts,
): Promise<CaptureResult<T>> {
  const startIdx = buffer.length();
  const result = await fn();

  let reachedExpectedState: boolean | null = null;
  if ('waitForState' in opts) {
    reachedExpectedState = await waitUntil(
      () => GetResourceState(opts.waitForState.name) === opts.waitForState.expect,
      opts.timeoutMs ?? 3000,
    );
  } else {
    await sleep(opts.delayMs);
  }

  return {
    result,
    lines: buffer.slice(startIdx),
    reachedExpectedState,
  };
}

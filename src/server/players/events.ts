type Listener = {
  event: string;
  fromSubject?: number;
  resolve: (payload: { from: number; args: unknown[] }) => void;
  timer: NodeJS.Timeout;
};

const listeners = new Set<Listener>();
const registeredEvents = new Set<string>();

function ensureNetHandler(event: string): void {
  if (registeredEvents.has(event)) return;
  registeredEvents.add(event);
  onNet(event, (...args: unknown[]) => {
    const source = (globalThis as { source?: number }).source ?? 0;
    const matched: Listener[] = [];
    for (const l of listeners) {
      if (l.event !== event) continue;
      if (l.fromSubject !== undefined && l.fromSubject !== source) continue;
      matched.push(l);
    }
    for (const l of matched) {
      clearTimeout(l.timer);
      listeners.delete(l);
      l.resolve({ from: source, args });
    }
  });
}

export type WaitResult = { from: number; args: unknown[] } | null;

export function waitForClientEvent(
  event: string,
  timeoutMs: number,
  fromSubject?: number,
): Promise<WaitResult> {
  ensureNetHandler(event);
  return new Promise<WaitResult>((resolve) => {
    const timer = setTimeout(() => {
      listeners.delete(listener);
      resolve(null);
    }, timeoutMs);
    const listener: Listener =
      fromSubject === undefined
        ? { event, resolve, timer }
        : { event, fromSubject, resolve, timer };
    listeners.add(listener);
  });
}

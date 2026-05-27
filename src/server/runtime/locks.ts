const chains = new Map<string, Promise<unknown>>();

export const GLOBAL_LOCK = '__global__';

export async function withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const prev = chains.get(key) ?? Promise.resolve();
  const next = prev.then(
    () => fn(),
    () => fn(),
  );
  const safe = next.catch(() => undefined);
  chains.set(key, safe);
  try {
    return await next;
  } finally {
    if (chains.get(key) === safe) {
      chains.delete(key);
    }
  }
}

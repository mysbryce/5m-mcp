export function isResourceStarted(name: string): { ok: true } | { ok: false; reason: string } {
  const state = GetResourceState(name);
  if (state === 'started') return { ok: true };
  return { ok: false, reason: `${name} is ${state || 'missing'}` };
}

export function safeExport<T>(resource: string, name: string): T | null {
  try {
    const ex = (globalThis as { exports?: Record<string, Record<string, unknown>> }).exports?.[
      resource
    ];
    if (!ex) return null;
    const fn = ex[name];
    return (fn as T) ?? null;
  } catch {
    return null;
  }
}

export function callExport<TResult>(
  resource: string,
  name: string,
  args: unknown[],
): TResult | null {
  const fn = safeExport<(...args: unknown[]) => TResult>(resource, name);
  if (!fn) return null;
  try {
    return fn(...args);
  } catch {
    return null;
  }
}

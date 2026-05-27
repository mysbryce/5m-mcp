/**
 * Dynamic native dispatcher for the client.
 *
 * The server sends `agent_api:client_native` with { probeId, native, args }.
 * We look the native up on globalThis (FiveM exposes all natives as globals),
 * substitute special args like "$ped", call it, and reply on
 * `agent_api:probe:result`.
 */

const SUBSTITUTIONS: Record<string, () => unknown> = {
  $ped: () => PlayerPedId(),
  $player: () => PlayerId(),
  $serverId: () => GetPlayerServerId(PlayerId()),
  $vehicle: () => GetVehiclePedIsIn(PlayerPedId(), false),
  $lastVehicle: () => GetVehiclePedIsIn(PlayerPedId(), true),
  $coords: () => GetEntityCoords(PlayerPedId(), true),
  $heading: () => GetEntityHeading(PlayerPedId()),
};

function resolveArgs(args: unknown[]): unknown[] {
  return args.map((a) => {
    if (typeof a === 'string' && a in SUBSTITUTIONS) {
      return SUBSTITUTIONS[a as keyof typeof SUBSTITUTIONS]!();
    }
    return a;
  });
}

function serializeForNet(value: unknown, depth = 0): unknown {
  if (depth > 5) return '[depth-cap]';
  if (value === null || value === undefined) return value;
  const t = typeof value;
  if (t === 'function') return null;
  if (t === 'bigint') return String(value);
  if (t === 'symbol') return String(value);
  if (t !== 'object') return value;
  if (Array.isArray(value)) {
    return value.slice(0, 200).map((v) => serializeForNet(v, depth + 1));
  }
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(value as object)) {
    out[k] = serializeForNet((value as Record<string, unknown>)[k], depth + 1);
  }
  return out;
}

export function installClientNativeBridge(): void {
  onNet('agent_api:client_native', (probeId: string, native: string, args: unknown[]) => {
    try {
      const fn = (globalThis as Record<string, unknown>)[native];
      if (typeof fn !== 'function') {
        emitNet('agent_api:probe:result', {
          probeId,
          ok: false,
          error: `native ${native} not found in client globals`,
        });
        return;
      }
      const resolved = resolveArgs(args ?? []);
      const raw = (fn as (...a: unknown[]) => unknown)(...resolved);
      emitNet('agent_api:probe:result', {
        probeId,
        ok: true,
        data: { native, args: resolved, result: serializeForNet(raw) },
      });
    } catch (e) {
      emitNet('agent_api:probe:result', {
        probeId,
        ok: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  onNet(
    'agent_api:client_native_list',
    (probeId: string, prefix: string | undefined, limit: number | undefined) => {
      try {
        const wanted = (prefix ?? '').toLowerCase();
        const max = Math.max(1, Math.min(2000, limit ?? 500));
        const names: string[] = [];
        for (const k of Object.keys(globalThis as object)) {
          if (typeof (globalThis as Record<string, unknown>)[k] !== 'function') continue;
          if (wanted && !k.toLowerCase().includes(wanted)) continue;
          names.push(k);
          if (names.length >= max) break;
        }
        emitNet('agent_api:probe:result', {
          probeId,
          ok: true,
          data: { count: names.length, names: names.sort() },
        });
      } catch (e) {
        emitNet('agent_api:probe:result', {
          probeId,
          ok: false,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    },
  );
}

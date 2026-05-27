import { randomBytes } from 'node:crypto';
import { Envelope, err, ok } from '../util/envelope';

export type ProbeName = 'entity_basic' | 'ped_status' | 'player_meta' | 'inventory_snap';

type ProbeResult = { ok: true; data: unknown } | { ok: false; error: string };

const pending = new Map<string, (r: ProbeResult) => void>();

export function installProbeListener(): void {
  onNet('agent_api:probe:result', (payload: { probeId: string } & ProbeResult) => {
    if (!payload || typeof payload.probeId !== 'string') return;
    const cb = pending.get(payload.probeId);
    if (cb) cb(payload);
  });
}

export async function callProbe(
  serverId: number,
  name: ProbeName,
  args: unknown,
  timeoutMs: number,
): Promise<Envelope<unknown>> {
  return callRemote(serverId, `agent_api:probe:${name}`, [args ?? {}], timeoutMs, name);
}

export async function callRemote(
  serverId: number,
  event: string,
  args: unknown[],
  timeoutMs: number,
  label?: string,
): Promise<Envelope<unknown>> {
  const probeId = randomBytes(8).toString('hex');
  return new Promise<Envelope<unknown>>((resolve) => {
    const timer = setTimeout(() => {
      pending.delete(probeId);
      resolve(err('CLIENT_PROBE_TIMEOUT', `${label ?? event} timed out after ${timeoutMs}ms.`));
    }, timeoutMs);
    pending.set(probeId, (result) => {
      clearTimeout(timer);
      pending.delete(probeId);
      if (result.ok) resolve(ok(result.data));
      else resolve(err('INTERNAL', result.error));
    });
    emitNet(event, serverId, probeId, ...args);
  });
}

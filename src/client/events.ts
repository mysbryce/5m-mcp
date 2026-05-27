import { entityBasic } from './probes/entity';
import { inventorySnap } from './probes/inventory';
import { pedStatus, playerMeta } from './probes/player';

type Probe = (args: unknown) => Record<string, unknown>;

const probes: Record<string, Probe> = {
  entity_basic: () => entityBasic(),
  ped_status: () => pedStatus(),
  player_meta: () => playerMeta(),
  inventory_snap: () => inventorySnap(),
};

function registerProbe(name: string, fn: Probe): void {
  onNet(`agent_api:probe:${name}`, (probeId: string, args: unknown) => {
    try {
      const data = fn(args);
      emitNet('agent_api:probe:result', { probeId, ok: true, data });
    } catch (e) {
      emitNet('agent_api:probe:result', {
        probeId,
        ok: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });
}

export function installClientProbes(): void {
  for (const [name, fn] of Object.entries(probes)) {
    registerProbe(name, fn);
  }
}

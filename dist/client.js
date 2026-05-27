"use strict";

// src/client/probes/entity.ts
function entityBasic() {
  const ped = PlayerPedId();
  const coords = GetEntityCoords(ped, true);
  const vehicle = GetVehiclePedIsIn(ped, false);
  return {
    ped,
    coords: { x: coords[0], y: coords[1], z: coords[2] },
    heading: GetEntityHeading(ped),
    modelHash: GetEntityModel(ped),
    inVehicle: vehicle !== 0,
    vehicleId: vehicle !== 0 ? vehicle : null
  };
}

// src/client/probes/inventory.ts
function inventorySnap() {
  var _a;
  try {
    const ox = (_a = globalThis.exports) == null ? void 0 : _a.ox_inventory;
    if (ox == null ? void 0 : ox.GetPlayerItems) {
      return { source: "ox_inventory", items: ox.GetPlayerItems() };
    }
  } catch {
  }
  return { available: false, reason: "No supported inventory export found on client." };
}

// src/client/probes/player.ts
function pedStatus() {
  const ped = PlayerPedId();
  return {
    health: GetEntityHealth(ped),
    armor: GetPedArmour(ped),
    isDead: IsEntityDead(ped),
    isInVehicle: IsPedInAnyVehicle(ped, false)
  };
}
function playerMeta() {
  const pid = PlayerId();
  return {
    playerId: pid,
    serverId: GetPlayerServerId(pid),
    name: GetPlayerName(pid)
  };
}

// src/client/events.ts
var probes = {
  entity_basic: () => entityBasic(),
  ped_status: () => pedStatus(),
  player_meta: () => playerMeta(),
  inventory_snap: () => inventorySnap()
};
function registerProbe(name, fn) {
  onNet(`agent_api:probe:${name}`, (probeId, args) => {
    try {
      const data = fn(args);
      emitNet("agent_api:probe:result", { probeId, ok: true, data });
    } catch (e) {
      emitNet("agent_api:probe:result", {
        probeId,
        ok: false,
        error: e instanceof Error ? e.message : String(e)
      });
    }
  });
}
function installClientProbes() {
  for (const [name, fn] of Object.entries(probes)) {
    registerProbe(name, fn);
  }
}

// src/client/native.ts
var SUBSTITUTIONS = {
  $ped: () => PlayerPedId(),
  $player: () => PlayerId(),
  $serverId: () => GetPlayerServerId(PlayerId()),
  $vehicle: () => GetVehiclePedIsIn(PlayerPedId(), false),
  $lastVehicle: () => GetVehiclePedIsIn(PlayerPedId(), true),
  $coords: () => GetEntityCoords(PlayerPedId(), true),
  $heading: () => GetEntityHeading(PlayerPedId())
};
function resolveArgs(args) {
  return args.map((a) => {
    if (typeof a === "string" && a in SUBSTITUTIONS) {
      return SUBSTITUTIONS[a]();
    }
    return a;
  });
}
function serializeForNet(value, depth = 0) {
  if (depth > 5) return "[depth-cap]";
  if (value === null || value === void 0) return value;
  const t = typeof value;
  if (t === "function") return null;
  if (t === "bigint") return String(value);
  if (t === "symbol") return String(value);
  if (t !== "object") return value;
  if (Array.isArray(value)) {
    return value.slice(0, 200).map((v) => serializeForNet(v, depth + 1));
  }
  const out = {};
  for (const k of Object.keys(value)) {
    out[k] = serializeForNet(value[k], depth + 1);
  }
  return out;
}
function installClientNativeBridge() {
  onNet("agent_api:client_native", (probeId, native, args) => {
    try {
      const fn = globalThis[native];
      if (typeof fn !== "function") {
        emitNet("agent_api:probe:result", {
          probeId,
          ok: false,
          error: `native ${native} not found in client globals`
        });
        return;
      }
      const resolved = resolveArgs(args ?? []);
      const raw = fn(...resolved);
      emitNet("agent_api:probe:result", {
        probeId,
        ok: true,
        data: { native, args: resolved, result: serializeForNet(raw) }
      });
    } catch (e) {
      emitNet("agent_api:probe:result", {
        probeId,
        ok: false,
        error: e instanceof Error ? e.message : String(e)
      });
    }
  });
  onNet(
    "agent_api:client_native_list",
    (probeId, prefix, limit) => {
      try {
        const wanted = (prefix ?? "").toLowerCase();
        const max = Math.max(1, Math.min(2e3, limit ?? 500));
        const names = [];
        for (const k of Object.keys(globalThis)) {
          if (typeof globalThis[k] !== "function") continue;
          if (wanted && !k.toLowerCase().includes(wanted)) continue;
          names.push(k);
          if (names.length >= max) break;
        }
        emitNet("agent_api:probe:result", {
          probeId,
          ok: true,
          data: { count: names.length, names: names.sort() }
        });
      } catch (e) {
        emitNet("agent_api:probe:result", {
          probeId,
          ok: false,
          error: e instanceof Error ? e.message : String(e)
        });
      }
    }
  );
}

// src/client/index.ts
var RESOURCE_NAME = GetCurrentResourceName();
var VERSION = "0.0.1";
installClientProbes();
installClientNativeBridge();
console.log(`[${RESOURCE_NAME}] client up \u2014 v${VERSION} (M6)`);

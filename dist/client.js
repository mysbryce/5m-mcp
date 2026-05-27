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

// src/client/index.ts
var RESOURCE_NAME = GetCurrentResourceName();
var VERSION = "0.0.1";
installClientProbes();
console.log(`[${RESOURCE_NAME}] client up \u2014 v${VERSION} (M5)`);

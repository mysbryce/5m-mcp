export function pedStatus(): Record<string, unknown> {
  const ped = PlayerPedId();
  return {
    health: GetEntityHealth(ped),
    armor: GetPedArmour(ped),
    isDead: IsEntityDead(ped),
    isInVehicle: IsPedInAnyVehicle(ped, false),
  };
}

export function playerMeta(): Record<string, unknown> {
  const pid = PlayerId();
  return {
    playerId: pid,
    serverId: GetPlayerServerId(pid),
    name: GetPlayerName(pid),
  };
}

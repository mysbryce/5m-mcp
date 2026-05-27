export function entityBasic(): Record<string, unknown> {
  const ped = PlayerPedId();
  const coords = GetEntityCoords(ped, true);
  const vehicle = GetVehiclePedIsIn(ped, false);
  return {
    ped,
    coords: { x: coords[0], y: coords[1], z: coords[2] },
    heading: GetEntityHeading(ped),
    modelHash: GetEntityModel(ped),
    inVehicle: vehicle !== 0,
    vehicleId: vehicle !== 0 ? vehicle : null,
  };
}

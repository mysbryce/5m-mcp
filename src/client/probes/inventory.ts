/**
 * Best-effort inventory snapshot. Tries common framework exports;
 * returns { available: false } if none are present.
 */
export function inventorySnap(): Record<string, unknown> {
  try {
    const ox = (globalThis as { exports?: { ox_inventory?: { GetPlayerItems?: () => unknown } } })
      .exports?.ox_inventory;
    if (ox?.GetPlayerItems) {
      return { source: 'ox_inventory', items: ox.GetPlayerItems() };
    }
  } catch {
    // fall through
  }
  return { available: false, reason: 'No supported inventory export found on client.' };
}

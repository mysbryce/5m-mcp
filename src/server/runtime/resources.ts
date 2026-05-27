export type ResourceInfo = {
  name: string;
  state: string;
  path: string;
};

export function listResources(): ResourceInfo[] {
  const count = GetNumResources();
  const out: ResourceInfo[] = [];
  for (let i = 0; i < count; i++) {
    const name = GetResourceByFindIndex(i);
    if (!name) continue;
    out.push({
      name,
      state: GetResourceState(name),
      path: GetResourcePath(name),
    });
  }
  return out;
}

export function getResourceInfo(name: string): ResourceInfo | null {
  const state = GetResourceState(name);
  if (!state || state === 'missing') return null;
  return { name, state, path: GetResourcePath(name) };
}

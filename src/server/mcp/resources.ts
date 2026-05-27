export type McpResource = {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
  read: () => string | Promise<string>;
};

const resources = new Map<string, McpResource>();

export function registerResource(r: McpResource): void {
  resources.set(r.uri, r);
}

export function listResources(): Array<{
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}> {
  return [...resources.values()].map((r) => ({
    uri: r.uri,
    name: r.name,
    description: r.description,
    mimeType: r.mimeType,
  }));
}

export async function readResource(
  uri: string,
): Promise<{ uri: string; mimeType: string; text: string } | null> {
  const r = resources.get(uri);
  if (!r) return null;
  return { uri, mimeType: r.mimeType, text: await r.read() };
}

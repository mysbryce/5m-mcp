export type OptInSession = {
  serverId: number;
  license: string;
  name: string;
  optedInAt: number;
  expiresAt: number;
};

const sessions = new Map<number, OptInSession>();

function now(): number {
  return Date.now();
}

function readLicense(serverId: number): string {
  const n = GetNumPlayerIdentifiers(String(serverId));
  for (let i = 0; i < n; i++) {
    const id = GetPlayerIdentifier(String(serverId), i);
    if (id && id.startsWith('license:')) return id;
  }
  return GetPlayerIdentifier(String(serverId), 0) ?? `unknown:${serverId}`;
}

export function addOptIn(serverId: number, ttlSeconds: number): OptInSession {
  const license = readLicense(serverId);
  const name = GetPlayerName(String(serverId)) ?? `player_${serverId}`;
  const t = now();
  const session: OptInSession = {
    serverId,
    license,
    name,
    optedInAt: t,
    expiresAt: t + ttlSeconds * 1000,
  };
  sessions.set(serverId, session);
  return session;
}

export function removeOptIn(serverId: number): boolean {
  return sessions.delete(serverId);
}

export function getOptIn(serverId: number): OptInSession | null {
  const s = sessions.get(serverId);
  if (!s) return null;
  if (s.expiresAt < now()) {
    sessions.delete(serverId);
    return null;
  }
  return s;
}

export function listOptedIn(): OptInSession[] {
  const t = now();
  for (const [id, s] of sessions) {
    if (s.expiresAt < t) sessions.delete(id);
  }
  return [...sessions.values()];
}

export function dropPlayer(serverId: number): void {
  sessions.delete(serverId);
}

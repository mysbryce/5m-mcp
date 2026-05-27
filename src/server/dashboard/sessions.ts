import { randomBytes } from 'node:crypto';

type Session = { userId: string; expiresAt: number };

const sessions = new Map<string, Session>();
const TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

export function createSession(userId: string): string {
  const token = randomBytes(32).toString('hex');
  sessions.set(token, { userId, expiresAt: Date.now() + TTL_MS });
  return token;
}

export function getSessionUserId(token: string | undefined): string | null {
  if (!token) return null;
  const s = sessions.get(token);
  if (!s) return null;
  if (s.expiresAt < Date.now()) {
    sessions.delete(token);
    return null;
  }
  return s.userId;
}

export function destroySession(token: string | undefined): void {
  if (token) sessions.delete(token);
}

export function destroyUserSessions(userId: string): void {
  for (const [token, s] of sessions) {
    if (s.userId === userId) sessions.delete(token);
  }
}

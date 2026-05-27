import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

export type Role = 'master' | 'member';

export type User = {
  id: string;
  username: string;
  salt: string;
  hash: string;
  role: Role;
  createdAt: string;
};

export type PublicUser = {
  id: string;
  username: string;
  role: Role;
  createdAt: string;
};

const FILE = 'dist/users.json';
let cache: User[] | null = null;

function filePath(): string {
  const p = join(GetResourcePath(GetCurrentResourceName()), FILE);
  mkdirSync(dirname(p), { recursive: true });
  return p;
}

function load(): User[] {
  if (cache) return cache;
  const p = filePath();
  if (!existsSync(p)) {
    cache = [];
    return cache;
  }
  try {
    cache = JSON.parse(readFileSync(p, 'utf8')) as User[];
  } catch {
    cache = [];
  }
  return cache;
}

function persist(): void {
  writeFileSync(filePath(), JSON.stringify(cache ?? [], null, 2), 'utf8');
}

function hashPassword(password: string, salt: string): string {
  return scryptSync(password, salt, 64).toString('hex');
}

export function userCount(): number {
  return load().length;
}

export function signupOpen(): boolean {
  // Signup is only open when there are zero users (first user becomes master).
  // After that, the master invites/creates additional users from the dashboard.
  return load().length === 0;
}

export function listUsers(): PublicUser[] {
  return load().map((u) => ({
    id: u.id,
    username: u.username,
    role: u.role,
    createdAt: u.createdAt,
  }));
}

export function findByUsername(username: string): User | undefined {
  return load().find((u) => u.username.toLowerCase() === username.toLowerCase());
}

export function findById(id: string): User | undefined {
  return load().find((u) => u.id === id);
}

export function toPublic(u: User): PublicUser {
  return { id: u.id, username: u.username, role: u.role, createdAt: u.createdAt };
}

export type CreateResult = { ok: true; user: User } | { ok: false; reason: string };

export function createUser(username: string, password: string, role: Role): CreateResult {
  const uname = username.trim();
  if (uname.length < 3 || uname.length > 32) {
    return { ok: false, reason: 'Username must be 3–32 characters.' };
  }
  if (!/^[a-zA-Z0-9_.-]+$/.test(uname)) {
    return { ok: false, reason: 'Username may only contain letters, numbers, _ . -' };
  }
  if (password.length < 8) {
    return { ok: false, reason: 'Password must be at least 8 characters.' };
  }
  if (findByUsername(uname)) {
    return { ok: false, reason: 'Username already taken.' };
  }
  const users = load();
  const salt = randomBytes(16).toString('hex');
  const user: User = {
    id: randomBytes(8).toString('hex'),
    username: uname,
    salt,
    hash: hashPassword(password, salt),
    role,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  persist();
  return { ok: true, user };
}

export function verifyPassword(user: User, password: string): boolean {
  const candidate = Buffer.from(hashPassword(password, user.salt), 'hex');
  const stored = Buffer.from(user.hash, 'hex');
  if (candidate.length !== stored.length) return false;
  return timingSafeEqual(candidate, stored);
}

export function deleteUser(id: string): { ok: true } | { ok: false; reason: string } {
  const users = load();
  const target = users.find((u) => u.id === id);
  if (!target) return { ok: false, reason: 'User not found.' };
  if (target.role === 'master') {
    return { ok: false, reason: 'Cannot delete the master account.' };
  }
  cache = users.filter((u) => u.id !== id);
  persist();
  return { ok: true };
}

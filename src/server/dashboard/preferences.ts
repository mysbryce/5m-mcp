import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

export type PreferenceType = 'structure' | 'coding' | 'ui-design';

export type Preference = {
  id: string;
  type: PreferenceType;
  description: string;
  exampleResource?: string | undefined;
  examplePath?: string | undefined;
  enabled: boolean;
  createdAt: string;
};

const TYPES = new Set<PreferenceType>(['structure', 'coding', 'ui-design']);
const FILE = 'dist/preferences.json';
let cache: Preference[] | null = null;

function filePath(): string {
  const p = join(GetResourcePath(GetCurrentResourceName()), FILE);
  mkdirSync(dirname(p), { recursive: true });
  return p;
}

function load(): Preference[] {
  if (cache) return cache;
  const p = filePath();
  if (!existsSync(p)) {
    cache = [];
    return cache;
  }
  try {
    cache = JSON.parse(readFileSync(p, 'utf8')) as Preference[];
  } catch {
    cache = [];
  }
  return cache;
}

function persist(): void {
  writeFileSync(filePath(), JSON.stringify(cache ?? [], null, 2), 'utf8');
}

export function listPreferences(): Preference[] {
  return load();
}

export function enabledPreferences(): Preference[] {
  return load().filter((p) => p.enabled);
}

export type UpsertInput = {
  id?: string | undefined;
  type: string;
  description: string;
  exampleResource?: string | undefined;
  examplePath?: string | undefined;
  enabled?: boolean | undefined;
};

export type UpsertResult = { ok: true; preference: Preference } | { ok: false; reason: string };

export function upsertPreference(input: UpsertInput): UpsertResult {
  const type = input.type as PreferenceType;
  if (!TYPES.has(type)) {
    return { ok: false, reason: `type must be one of: ${[...TYPES].join(', ')}.` };
  }
  const description = (input.description ?? '').trim();
  if (!description) {
    return { ok: false, reason: 'description is required.' };
  }
  const exampleResource = input.exampleResource?.trim() || undefined;
  const examplePath = input.examplePath?.trim() || undefined;
  const enabled = input.enabled !== false;
  const items = load();

  if (input.id) {
    const existing = items.find((p) => p.id === input.id);
    if (!existing) return { ok: false, reason: 'Preference not found.' };
    existing.type = type;
    existing.description = description;
    existing.exampleResource = exampleResource;
    existing.examplePath = examplePath;
    existing.enabled = enabled;
    persist();
    return { ok: true, preference: existing };
  }

  const preference: Preference = {
    id: randomBytes(8).toString('hex'),
    type,
    description,
    exampleResource,
    examplePath,
    enabled,
    createdAt: new Date().toISOString(),
  };
  items.push(preference);
  persist();
  return { ok: true, preference };
}

export function deletePreference(id: string): { ok: true } | { ok: false; reason: string } {
  const items = load();
  if (!items.some((p) => p.id === id)) return { ok: false, reason: 'Preference not found.' };
  cache = items.filter((p) => p.id !== id);
  persist();
  return { ok: true };
}

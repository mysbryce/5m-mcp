import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { listTools } from '../tools/registry';

export type SkillTriggers = { tools: string[]; categories: string[] };

export type SkillMeta = {
  id: string;
  name: string;
  description: string;
  triggers: SkillTriggers;
  enabled: boolean;
  createdAt: string;
};

export type Skill = SkillMeta & { body: string };

// Category → predicate over a tool name. Plugin tools are matched by prefix
// because they are registered dynamically (esx_*, oxlib_*, oxmysql_*).
const CATEGORY_TOOLS: Record<string, (name: string) => boolean> = {
  write: (n) => ['write_file', 'edit_file', 'create_resource'].includes(n),
  lifecycle: (n) =>
    [
      'ensure_resource',
      'start_resource',
      'stop_resource',
      'restart_resource',
      'refresh_resources',
      'run_command',
    ].includes(n),
  scaffold: (n) => ['scaffold_fivem_resource_workflow', 'create_resource'].includes(n),
  ui: (n) => ['screenshot_nui', 'delete_screenshot', 'run_shell'].includes(n),
  native: (n) =>
    [
      'client_call_native',
      'server_call_native',
      'client_list_natives',
      'server_list_natives',
    ].includes(n),
  player: (n) =>
    [
      'list_players',
      'register_test_subject',
      'unregister_test_subject',
      'get_player_state',
      'trigger_client_event',
      'send_chat',
      'wait_for_client_event',
    ].includes(n),
  shell: (n) => n === 'run_shell',
  plugin: (n) => /^(esx|oxlib|oxmysql)_/.test(n),
};

const CATEGORIES = Object.keys(CATEGORY_TOOLS);

function toolCategories(name: string): string[] {
  return CATEGORIES.filter((c) => CATEGORY_TOOLS[c]!(name));
}

const INDEX_FILE = 'dist/skills.json';
const BODY_DIR = 'dist/skills';
let cache: SkillMeta[] | null = null;

function resourceDir(): string {
  return GetResourcePath(GetCurrentResourceName());
}

function indexPath(): string {
  const p = join(resourceDir(), INDEX_FILE);
  mkdirSync(dirname(p), { recursive: true });
  return p;
}

function bodyPath(id: string): string {
  const dir = join(resourceDir(), BODY_DIR);
  mkdirSync(dir, { recursive: true });
  return join(dir, `${id}.md`);
}

function load(): SkillMeta[] {
  if (cache) return cache;
  const p = indexPath();
  if (!existsSync(p)) {
    cache = [];
    return cache;
  }
  try {
    cache = JSON.parse(readFileSync(p, 'utf8')) as SkillMeta[];
  } catch {
    cache = [];
  }
  return cache;
}

function persist(): void {
  writeFileSync(indexPath(), JSON.stringify(cache ?? [], null, 2), 'utf8');
}

function readBody(id: string): string {
  const p = bodyPath(id);
  if (!existsSync(p)) return '';
  try {
    return readFileSync(p, 'utf8');
  } catch {
    return '';
  }
}

function hydrate(m: SkillMeta): Skill {
  return { ...m, body: readBody(m.id) };
}

function toStrArray(v: unknown): string[] {
  return Array.isArray(v) ? v.map((x) => String(x)).filter(Boolean) : [];
}

export function listSkills(): Skill[] {
  return load().map(hydrate);
}

export function availableTriggers(): { tools: string[]; categories: string[] } {
  const tools = listTools()
    .map((t) => t.name)
    .sort();
  return { tools, categories: [...CATEGORIES] };
}

function sanitizeTriggers(raw: unknown): SkillTriggers {
  const obj = (raw ?? {}) as Record<string, unknown>;
  const categories = toStrArray(obj.categories).filter((c) => CATEGORIES.includes(c));
  return { tools: toStrArray(obj.tools), categories };
}

export type SkillUpsert = {
  id?: string | undefined;
  name: string;
  description?: string | undefined;
  body: string;
  triggers?: unknown;
  enabled?: boolean | undefined;
};

export type SkillResult = { ok: true; skill: Skill } | { ok: false; reason: string };

export function upsertSkill(input: SkillUpsert): SkillResult {
  const name = (input.name ?? '').trim();
  if (name.length < 2 || name.length > 64) {
    return { ok: false, reason: 'name must be 2–64 characters.' };
  }
  const body = input.body ?? '';
  if (!body.trim()) {
    return { ok: false, reason: 'Skill body is required.' };
  }
  const description = (input.description ?? '').trim();
  const triggers = sanitizeTriggers(input.triggers);
  const enabled = input.enabled !== false;
  const items = load();

  if (input.id) {
    const existing = items.find((m) => m.id === input.id);
    if (!existing) return { ok: false, reason: 'Skill not found.' };
    existing.name = name;
    existing.description = description;
    existing.triggers = triggers;
    existing.enabled = enabled;
    writeFileSync(bodyPath(existing.id), body, 'utf8');
    persist();
    return { ok: true, skill: { ...existing, body } };
  }

  const meta: SkillMeta = {
    id: randomBytes(8).toString('hex'),
    name,
    description,
    triggers,
    enabled,
    createdAt: new Date().toISOString(),
  };
  writeFileSync(bodyPath(meta.id), body, 'utf8');
  items.push(meta);
  persist();
  return { ok: true, skill: { ...meta, body } };
}

export function deleteSkill(id: string): { ok: true } | { ok: false; reason: string } {
  const items = load();
  if (!items.some((m) => m.id === id)) return { ok: false, reason: 'Skill not found.' };
  cache = items.filter((m) => m.id !== id);
  persist();
  try {
    rmSync(bodyPath(id), { force: true });
  } catch {
    // body file may already be gone — ignore
  }
  return { ok: true };
}

/** Enabled skills that should fire for a given tool name. */
export function skillsForTool(toolName: string): Skill[] {
  const cats = toolCategories(toolName);
  return load()
    .filter(
      (m) =>
        m.enabled &&
        (m.triggers.tools.includes(toolName) ||
          m.triggers.categories.some((c) => cats.includes(c))),
    )
    .map(hydrate);
}

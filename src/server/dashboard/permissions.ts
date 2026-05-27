import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

export type PermType = 'bool' | 'csv' | 'int' | 'enum';

export type PermDescriptor = {
  convar: string;
  label: string;
  group: string;
  type: PermType;
  description: string;
  options?: string[];
  default: string;
};

export const PERMISSIONS: PermDescriptor[] = [
  {
    convar: 'agent_api_readonly',
    label: 'Read-only mode',
    group: 'Core',
    type: 'bool',
    description: 'Master kill-switch. When on, every mutating tool refuses.',
    default: 'false',
  },
  {
    convar: 'agent_api_allow_write_paths',
    label: 'Extra write roots',
    group: 'Core',
    type: 'csv',
    description: 'Additional folders (relative to server data dir) the agent may write into.',
    default: '',
  },
  {
    convar: 'agent_api_allow_control_paths',
    label: 'Extra control roots',
    group: 'Core',
    type: 'csv',
    description: 'Additional folders whose resources the agent may ensure/start/stop/restart.',
    default: '',
  },
  {
    convar: 'agent_api_rate_per_minute',
    label: 'Rate limit (req/min)',
    group: 'Core',
    type: 'int',
    description: 'Token-bucket cap per agent token.',
    default: '120',
  },
  {
    convar: 'agent_api_client_blocked_natives',
    label: 'Blocked client natives',
    group: 'Natives',
    type: 'csv',
    description: 'Client natives client_call_native must always refuse.',
    default: '',
  },
  {
    convar: 'agent_api_server_blocked_natives',
    label: 'Blocked server natives',
    group: 'Natives',
    type: 'csv',
    description: 'Extra server natives to refuse (on top of the built-in danger list).',
    default: '',
  },
  {
    convar: 'agent_api_shell_allowed_commands',
    label: 'Shell allowlist',
    group: 'Shell',
    type: 'csv',
    description:
      'Binaries run_shell may execute. Empty = default (npm,npx,pnpm,yarn,bun,vite,git,node).',
    default: '',
  },
  {
    convar: 'agent_api_plugin_esx_enabled',
    label: 'ESX plugin',
    group: 'Plugins',
    type: 'enum',
    options: ['auto', 'true', 'false'],
    description: 'Load the ESX bridge.',
    default: 'auto',
  },
  {
    convar: 'agent_api_plugin_oxlib_enabled',
    label: 'ox_lib plugin',
    group: 'Plugins',
    type: 'enum',
    options: ['auto', 'true', 'false'],
    description: 'Load the ox_lib bridge.',
    default: 'auto',
  },
  {
    convar: 'agent_api_plugin_oxmysql_enabled',
    label: 'oxmysql plugin',
    group: 'Plugins',
    type: 'enum',
    options: ['auto', 'true', 'false'],
    description: 'Load the oxmysql bridge.',
    default: 'auto',
  },
  {
    convar: 'agent_api_plugin_oxmysql_readonly',
    label: 'oxmysql read-only',
    group: 'Plugins',
    type: 'bool',
    description: 'When on, oxmysql tools only allow SELECT.',
    default: 'true',
  },
  {
    convar: 'agent_api_plugin_oxmysql_allow_statements',
    label: 'oxmysql allowed statements',
    group: 'Plugins',
    type: 'csv',
    description: 'Uppercase SQL verbs the agent may run, e.g. SELECT,INSERT,UPDATE,DELETE.',
    default: 'SELECT',
  },
  {
    convar: 'agent_api_plugin_esx_blocked_methods',
    label: 'ESX blocked methods',
    group: 'Plugins',
    type: 'csv',
    description: 'xPlayer/ESX method names esx_call_* must refuse.',
    default: '',
  },
  {
    convar: 'agent_api_plugin_oxlib_blocked_methods',
    label: 'ox_lib blocked methods',
    group: 'Plugins',
    type: 'csv',
    description: 'ox_lib server export names oxlib_call must refuse.',
    default: '',
  },
];

const FILE = 'dist/permissions.json';

function filePath(): string {
  const p = join(GetResourcePath(GetCurrentResourceName()), FILE);
  mkdirSync(dirname(p), { recursive: true });
  return p;
}

function readOverrides(): Record<string, string> {
  const p = filePath();
  if (!existsSync(p)) return {};
  try {
    return JSON.parse(readFileSync(p, 'utf8')) as Record<string, string>;
  } catch {
    return {};
  }
}

function writeOverrides(values: Record<string, string>): void {
  writeFileSync(filePath(), JSON.stringify(values, null, 2), 'utf8');
}

const KNOWN = new Set(PERMISSIONS.map((p) => p.convar));

/** Apply persisted overrides to live convars. Call once at boot, before loadConvars(). */
export function applyPersistedOverrides(): void {
  const stored = readOverrides();
  for (const [k, v] of Object.entries(stored)) {
    if (KNOWN.has(k)) SetConvar(k, v);
  }
}

export function currentValues(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const p of PERMISSIONS) {
    out[p.convar] = GetConvar(p.convar, p.default);
  }
  return out;
}

export type ApplyResult =
  | { ok: true; values: Record<string, string> }
  | { ok: false; reason: string };

function validate(p: PermDescriptor, value: string): string | null {
  if (p.type === 'bool') {
    const v = value.toLowerCase();
    if (!['true', 'false'].includes(v)) return `${p.label} must be true or false.`;
  }
  if (p.type === 'int') {
    if (!/^\d+$/.test(value)) return `${p.label} must be a non-negative integer.`;
  }
  if (p.type === 'enum' && p.options && !p.options.includes(value)) {
    return `${p.label} must be one of: ${p.options.join(', ')}.`;
  }
  return null;
}

/**
 * Apply a partial set of permission updates: validate, SetConvar live,
 * persist to disk, then run the reload hook so cached convars refresh.
 */
export function applyUpdates(updates: Record<string, unknown>, reload: () => void): ApplyResult {
  const next = readOverrides();
  for (const [convar, raw] of Object.entries(updates)) {
    const desc = PERMISSIONS.find((p) => p.convar === convar);
    if (!desc) return { ok: false, reason: `Unknown permission: ${convar}` };
    const value = String(raw).trim();
    const err = validate(desc, value);
    if (err) return { ok: false, reason: err };
    SetConvar(convar, value);
    next[convar] = value;
  }
  writeOverrides(next);
  reload();
  return { ok: true, values: currentValues() };
}

import { Convars } from '../config/convars';
import { listTools, register } from '../tools/registry';
import { Plugin, PluginStatus } from './types';

function pluginConvar(name: string): string {
  return `agent_api_plugin_${name}_enabled`;
}

function isExplicitlyDisabled(plugin: Plugin): boolean {
  const v = GetConvar(pluginConvar(plugin.name), 'auto').toLowerCase();
  return v === 'false' || v === '0' || v === 'no' || v === 'off';
}

function isExplicitlyEnabled(plugin: Plugin): boolean {
  const v = GetConvar(pluginConvar(plugin.name), 'auto').toLowerCase();
  return v === 'true' || v === '1' || v === 'yes' || v === 'on' || v === 'force';
}

export function loadPlugins(plugins: Plugin[], convars: Convars): PluginStatus[] {
  const before = new Set(listTools().map((t) => t.name));
  const statuses: PluginStatus[] = [];

  for (const plugin of plugins) {
    if (isExplicitlyDisabled(plugin)) {
      statuses.push({
        name: plugin.name,
        enabled: false,
        reason: `${pluginConvar(plugin.name)} = false`,
        toolNames: [],
      });
      continue;
    }

    const detected = plugin.detect();
    if (!detected.ok && !isExplicitlyEnabled(plugin)) {
      statuses.push({
        name: plugin.name,
        enabled: false,
        reason: detected.reason,
        toolNames: [],
      });
      continue;
    }

    try {
      plugin.install({ convars, register });
      const after = new Set(listTools().map((t) => t.name));
      const added = [...after].filter((n) => !before.has(n));
      for (const n of added) before.add(n);
      statuses.push({ name: plugin.name, enabled: true, toolNames: added });
    } catch (e) {
      statuses.push({
        name: plugin.name,
        enabled: false,
        reason: `install failed: ${e instanceof Error ? e.message : String(e)}`,
        toolNames: [],
      });
    }
  }

  return statuses;
}

export function logPluginStatuses(statuses: PluginStatus[]): void {
  const tag = `[${GetCurrentResourceName()}]`;
  if (statuses.length === 0) {
    console.log(`${tag} plugins: (none registered)`);
    return;
  }
  for (const s of statuses) {
    if (s.enabled) {
      console.log(
        `${tag} plugin enabled : ${s.name} (+${s.toolNames.length} tools: ${s.toolNames.join(', ') || '-'})`,
      );
    } else {
      console.log(`${tag} plugin skipped : ${s.name} (${s.reason})`);
    }
  }
}

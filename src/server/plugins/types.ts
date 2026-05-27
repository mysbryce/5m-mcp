import { Convars } from '../config/convars';
import { register } from '../tools/registry';

export type PluginContext = {
  convars: Convars;
  register: typeof register;
};

export type PluginStatus = {
  name: string;
  enabled: boolean;
  reason?: string;
  toolNames: string[];
};

export type Plugin = {
  /** Unique short name, used in convars (e.g. `esx` → agent_api_plugin_esx_*). */
  name: string;
  /** One-line description for status/list output. */
  description: string;
  /** Returns true if the dependent resource(s) are present and started. */
  detect: () => { ok: true } | { ok: false; reason: string };
  /** Register MCP tools with `ctx.register(...)`. Called once at boot if enabled. */
  install: (ctx: PluginContext) => void;
};

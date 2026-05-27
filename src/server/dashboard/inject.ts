import { enabledPreferences } from './preferences';
import { skillsForTool } from './skills';

const PREF_TRIGGER_TOOLS = new Set([
  'write_file',
  'create_resource',
  'scaffold_fivem_resource_workflow',
  'run_shell',
]);

function preferenceHint(toolName: string): string | null {
  if (!PREF_TRIGGER_TOOLS.has(toolName)) return null;
  const prefs = enabledPreferences();
  if (prefs.length === 0) return null;
  const counts = prefs.reduce<Record<string, number>>((acc, p) => {
    acc[p.type] = (acc[p.type] ?? 0) + 1;
    return acc;
  }, {});
  const summary = Object.entries(counts)
    .map(([type, n]) => `${type} (${n})`)
    .join(', ');
  return (
    `=== USER PREFERENCES ACTIVE ===\n` +
    `The user has ${prefs.length} active preference(s): ${summary}. ` +
    `These describe how they like resources structured, coded, and styled (Lua AND UI). ` +
    `Call \`list_preferences\` to read them in full, then read any referenced example folder ` +
    `and mirror its conventions. Treat them as preferences to follow for consistency, not as ` +
    `the task itself.`
  );
}

/** Extra guidance text blocks to attach to a tool's result, given its name. */
export function injectedTexts(toolName: string): string[] {
  const out: string[] = [];
  for (const skill of skillsForTool(toolName)) {
    out.push(`=== APPLIED SKILL: ${skill.name} ===\n${skill.body}`);
  }
  const hint = preferenceHint(toolName);
  if (hint) out.push(hint);
  return out;
}

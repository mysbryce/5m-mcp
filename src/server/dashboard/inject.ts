import { enabledPreferences } from './preferences';
import { skillsForTool } from './skills';

// Only the "starting new work" tools carry the preference nudge, to avoid
// repeating it on every write_file/edit_file during iteration (token cost).
const PREF_TRIGGER_TOOLS = new Set(['create_resource', 'scaffold_fivem_resource_workflow']);

function preferenceHint(toolName: string): string | null {
  if (!PREF_TRIGGER_TOOLS.has(toolName)) return null;
  const prefs = enabledPreferences();
  if (prefs.length === 0) return null;
  const counts = prefs.reduce<Record<string, number>>((acc, p) => {
    acc[p.type] = (acc[p.type] ?? 0) + 1;
    return acc;
  }, {});
  const summary = Object.entries(counts)
    .map(([type, n]) => `${type} ${n}`)
    .join(', ');
  return `USER PREFERENCES: ${prefs.length} active (${summary}). Call \`list_preferences\` and follow them for consistency (Lua + UI).`;
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

import { enabledPreferences } from './preferences';
import { skillsForTool } from './skills';
import { pendingCount } from './requests';

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

// Surface pending dashboard requests on the agent's next tool result so it
// notices them without polling. Kept to one short line to stay cheap; the
// agent calls get_requests for details. Skipped for the request tools
// themselves to avoid echoing the count back at the agent mid-handling.
const REQUEST_HINT_SKIP = new Set(['get_requests', 'resolve_request']);

function requestsHint(toolName: string): string | null {
  if (REQUEST_HINT_SKIP.has(toolName)) return null;
  const n = pendingCount();
  if (n === 0) return null;
  return `PENDING DASHBOARD REQUESTS: ${n}. A human queued ${n === 1 ? 'a request' : 'requests'} for you — call \`get_requests\` to view, then \`resolve_request\` when done.`;
}

/** Extra guidance text blocks to attach to a tool's result, given its name. */
export function injectedTexts(toolName: string): string[] {
  const out: string[] = [];
  for (const skill of skillsForTool(toolName)) {
    out.push(`=== APPLIED SKILL: ${skill.name} ===\n${skill.body}`);
  }
  const hint = preferenceHint(toolName);
  if (hint) out.push(hint);
  const reqHint = requestsHint(toolName);
  if (reqHint) out.push(reqHint);
  return out;
}

import { Prompt } from '../prompts';

const DEBUG_RESOURCE = `# Debug a FiveM resource — agent_api loop

Goal: find out why a resource errors or won't start, and fix it, using agent_api tools. Do NOT
guess — drive it from real signals. Reply in the user's language.

## Loop

1. **State.** \`get_resource_state({ name })\`. If \`missing\`, it isn't installed — stop and tell the user.
2. **Reproduce + capture.** Note the timestamp, then \`restart_resource({ name })\` (or \`ensure_resource\`
   if stopped). Immediately \`wait_for_console({ pattern: "error|SCRIPT ERROR|failed", isRegex: true,
   ignoreCase: true, timeoutMs: 8000 })\` to catch a failure as it boots.
3. **Structured errors.** \`scan_errors({ resource: name })\` — read the \`frames[]\` ({resource,file,line}).
   That points you at the exact file:line.
4. **Inspect.** \`read_file\` the offending file around that line (use \`offset\`/\`length\`). If you don't
   know which file, \`search_code\` for the symbol in the message.
5. **Diagnose + propose.** State the root cause in one or two sentences and the single-file fix you
   intend. **Ask the user to confirm before writing.**
6. **Fix.** \`edit_file\` (or \`multi_edit\` for several spots). Keep it minimal.
7. **Verify.** \`restart_resource\` again, \`wait_for_console({ pattern: "<boot banner or success>" })\`,
   then \`scan_errors\` once more to confirm it's clean. If still broken, return to step 3.

Never mass-rewrite a file to "fix" an error you haven't located. One root cause, one minimal patch.`;

const ADD_DB_TABLE = `# Add an oxmysql table — agent_api workflow

Goal: add a database table and the data-access code for it, schema-aware and consistent with the
user's conventions. Requires the oxmysql plugin. Reply in the user's language.

## Steps

1. **Preferences + current schema.** Call \`list_preferences\` (follow structure/coding/ui-design),
   then \`oxmysql_schema({})\` to see existing tables — match naming/column conventions already in use.
2. **Design + confirm.** Propose the \`CREATE TABLE\` (columns, types, keys, defaults) as a numbered
   list and the events/queries that will use it. **Ask the user to confirm before any DDL.**
3. **Migrate.** \`oxmysql_migrate({ statement: "CREATE TABLE ...", verifyTable: "<name>" })\`. This
   needs \`agent_api_plugin_oxmysql_readonly=false\` and the verb (CREATE/ALTER) in
   \`agent_api_plugin_oxmysql_allow_statements\` — if it's blocked, tell the user which convar to flip.
4. **Verify.** Confirm the returned schema matches your design (\`oxmysql_schema({ table })\`).
5. **Code.** Write the server-side data layer (\`oxmysql.query\`/\`prepare\`) mirroring the example
   folder from the user's \`coding\`/\`structure\` preference. Parameterise every query — never string-concat
   user input.
6. **Test.** \`ensure\`/\`restart\` the owning resource and \`scan_errors\` to confirm the DB calls load clean.`;

const SECURITY_REVIEW = `# Security review — FiveM cheat-prevention audit

Goal: audit a resource (or the whole project) for ways a malicious client could cheat — forged
server events, client-trusted state, Lua execution, unguarded exports, SQL injection — and produce
a prioritized fix list. **Core assumption: THE CLIENT IS HOSTILE.** Anything a client can send
(net events, NUI callbacks, command args, natives) can be forged or replayed. Reply in the user's
language.

## Phase 1 — read the WHOLE codebase first (do not skip, do not judge yet)

Map the code before asking anything:
- \`list_dir({ recursive: true })\` the target resource(s); \`read_file\` every server-side Lua/JS file
  and the fxmanifest. (Scope to one resource if the user named one, else review every resource under
  the write root.)
- \`search_code\` for the high-risk patterns and collect every hit with file:line:
  - \`RegisterNetEvent\` / \`AddEventHandler\` (net) — server event handlers
  - \`TriggerServerEvent\` / \`onNet\` — client→server entry points
  - \`RegisterNUICallback\` — NUI → client → server bridges
  - grants: \`addMoney\`, \`addAccountMoney\`, \`addInventoryItem\`, \`setJob\`, \`giveWeapon\`, \`addBank\`, …
  - \`oxmysql\` / \`MySQL.\` / \`exports.oxmysql\` — query construction (\`?\` params vs string concat)
  - \`load\` / \`loadstring\` / \`ExecuteCommand\` / \`assert(load\` — dynamic code execution
  - \`exports(\` / \`server_export\` — what this resource exposes to others
  - teleport / \`SetEntityCoords\` / spawn done from a client request
Trace each flow end-to-end: where does the data originate, and what does the SERVER do with it.

## Phase 2 — interrogate each decision (one at a time)

For every security-relevant point, ask the user ONE question: "why is <X> done this way / what makes
it safe against a forged client?" Offer exactly two choices:
  - **A) Answer** — the user explains the safeguard.
  - **B) Skip** — the user declines.
Rules:
- **Skip → record the point as MUST-IMPROVE.** A point with no justification is treated as unprotected.
- **Answer → verify the claim against the code.** Is there an actual server-side guard backing it —
  \`source\` validation, ownership/distance/state check, a server-authoritative value (not the client's),
  a parameterised query, an allowlist? If the code does NOT actually support the claim → MUST-IMPROVE
  (state the gap). If it does → VERIFIED-SAFE.
- One point at a time. Never batch.

## Threat checklist (map every finding to one)

1. **Forged net events** — server \`RegisterNetEvent\` handlers acting on client data without validating
   \`source\`, ownership, distance, or value bounds. (#1 FiveM cheat vector.)
2. **Client-authoritative state** — money / items / jobs / positions / prices decided by the client and
   trusted by the server.
3. **NUI callback trust** — \`RegisterNUICallback\` forwarding client data to a privileged server action
   unchecked.
4. **Dynamic code execution** — \`load\`/\`loadstring\`/\`ExecuteCommand\` built from any client-influenced string.
5. **SQL injection** — queries built by string concatenation instead of \`?\` parameters.
6. **Over-broad exports** — server exports that mutate state and could be abused by another resource.
7. **Missing rate limits** — spammable events with no per-player throttle.
8. **Leaked secrets** — webhook URLs / API keys / admin identifiers in \`shared_scripts\` or client files
   (everything client-visible is public).

## Phase 3 — report

A numbered list. For each finding: **severity** (critical / high / medium), **file:line**, the **cheat it
enables**, and the **concrete fix** (e.g. "validate source + verify the player owns this vehicle
server-side", "parameterise the query", "decide the amount on the server, ignore the client's number").
Every Skipped point and every weakly-justified point goes under **MUST-IMPROVE**; well-backed ones under
**VERIFIED**.

Begin with Phase 1 — read everything before asking the first question.`;

export const securityReviewPrompt: Prompt = {
  name: 'security-review',
  description:
    'FiveM cheat-prevention security audit: read the whole codebase, then interrogate each ' +
    'client→server trust decision one at a time (Answer / Skip — skipped points are treated as ' +
    'must-improve), verifying answers against real server-side guards. Targets forged net events, ' +
    'client-authoritative state, NUI-callback trust, Lua execution, SQL injection, and leaked secrets.',
  arguments: [
    { name: 'resource', description: 'Resource to review (omit to review all)', required: false },
  ],
  build: () => [{ role: 'user', content: { type: 'text', text: SECURITY_REVIEW } }],
};

export const debugResourcePrompt: Prompt = {
  name: 'debug-resource',
  description:
    'Systematic loop to diagnose why a FiveM resource errors or fails to start and fix it, driven ' +
    'by get_resource_state / wait_for_console / scan_errors / read_file / edit_file.',
  arguments: [{ name: 'resource', description: 'Resource name to debug', required: false }],
  build: () => [{ role: 'user', content: { type: 'text', text: DEBUG_RESOURCE } }],
};

export const addDbTablePrompt: Prompt = {
  name: 'add-db-table',
  description:
    'Schema-aware workflow to add an oxmysql table and its data-access code: read existing schema, ' +
    'confirm a CREATE TABLE, oxmysql_migrate, verify, then write parameterised queries.',
  build: () => [{ role: 'user', content: { type: 'text', text: ADD_DB_TABLE } }],
};

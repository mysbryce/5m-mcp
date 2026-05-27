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

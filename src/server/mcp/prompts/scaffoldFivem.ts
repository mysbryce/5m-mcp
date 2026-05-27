import { Prompt } from '../prompts';

export const scaffoldFivemPrompt: Prompt = {
  name: 'scaffold-fivem-resource',
  description:
    'Grill-mode workflow for scaffolding a new FiveM resource end-to-end via agent_api. ' +
    'The assistant MUST run through every question one at a time before any file is written, ' +
    'and every question MUST present a recommended default.',
  build: () => [
    {
      role: 'user',
      content: {
        type: 'text',
        text: SCRIPT,
      },
    },
  ],
};

const SCRIPT = `# FiveM Resource Scaffold — Grill Mode

You are about to scaffold a brand new FiveM resource for the user via the **agent_api** MCP tools. This prompt is a **hard contract**. Read it once, then follow it exactly.

---

## Mandatory rules

1. **DO NOT call \`create_resource\`, \`write_file\`, \`refresh_resources\`, or \`ensure_resource\` until every question in this script has been answered and you have replayed the full summary back to the user and they have explicitly confirmed.**
2. **Ask one question at a time.** Never batch questions. Wait for the user's answer before moving on.
3. **Every question MUST include a "Recommended:" line** with one option pre-picked and a one-sentence reason. The user should be able to type "ok"/"เอา" and move forward.
4. **Never assume.** If a downstream question only makes sense given a specific previous answer (e.g. UI framework only matters if UI=yes), still ask it explicitly when its branch becomes active. Do not skip silently.
5. **Capture every answer** — at the end, replay all of them as a checklist before scaffolding starts.
6. **Reply in the user's language.** The user's prior turns set the language. Match it. Keep tone tight and direct.

---

## Question tree

Walk this tree top-to-bottom. **Branches in bold** activate based on prior answers. Skip nothing in an active branch.

### 1. Identity

1.1 **Resource name?** (snake_case, [a-zA-Z][a-zA-Z0-9_-]{0,63})
    Recommended: ask the user, no good default exists.

1.2 **One-line description?** (used in fxmanifest and README)
    Recommended: derive from prior conversation, but confirm.

1.3 **Author?**
    Recommended: \`agent\` — they can change it later in fxmanifest.

### 2. Layout

2.1 **File layout?**
    - **A) One file** — single \`server.lua\` (or \`client.lua\`) doing everything. Good for prototypes, single-purpose utilities.
    - **B) Multiple files** — split by responsibility into subfolders. Required if the resource has more than ~150 LOC, has both client + server logic, or you want \`ox_lib\` integration.

    Recommended: **B** unless the user explicitly wants a one-file utility.

2.2 **If B — folder layout enforcement:**
    - **NEVER flat**. Group every file into a purpose-named subfolder.
    - Use this skeleton as the baseline (omit folders the resource doesn't need):
      \`\`\`
      <name>/
        fxmanifest.lua
        config/
          shared.lua            # values exposed to both runtimes
          client.lua            # client-only, visible to all clients
          server.lua            # server-only, never sent to client
        shared/
          types.lua             # type aliases / enums shared cl+sv
          util.lua              # pure helpers cl+sv
        server/
          main.lua              # entry: event registration, lifecycle
          state/                # in-memory stores, persistence bridges
          handlers/             # one file per event group
          db.lua                # oxmysql wrapper (if used)
        client/
          main.lua              # entry
          nui.lua               # NUI bridge (if UI exists)
          handlers/             # net event handlers
        README.md
      \`\`\`
    - Always create the README.md.
    - Group small files into sub-sub-folders only if there are 4+ siblings on the same concern.

    Recommended: keep the baseline above and prune empty folders at scaffold time.

### 3. Configuration

3.1 **Does the resource need user-tunable configuration?**
    - **A) None** — hard-coded defaults.
    - **B) Yes**

    Recommended: **B**. Even tiny resources benefit from one \`config/shared.lua\`.

3.2 **If B — config split (security-critical, do not skip):**
    - \`config/shared.lua\` — values that BOTH runtimes need (cooldowns, item names, blip sprites). Sent to clients.
    - \`config/client.lua\` — client-only UI/UX (theme, key bindings, distances). Sent to clients.
    - \`config/server.lua\` — secrets and trust-boundary values (webhook URLs, admin lists, gate thresholds). **NEVER required from client**.

    Confirm the user understands: anything in \`shared.lua\` or \`client.lua\` is visible to every client. Webhook URLs, API keys, admin steam IDs MUST go in \`server.lua\`.

    Recommended: create all three even if only one has values for now.

### 4. Framework integration

4.1 **Framework integration?**
    - **A) Standalone** — no external framework deps.
    - **B) ESX** — \`es_extended\`
    - **C) QBCore** — \`qb-core\` (currently no agent_api plugin; agent_api will still work, manual export wiring needed)
    - **D) ox_core** — \`ox_core\`
    - **E) Multiple** — adapter layer per framework.

    Recommended: pick the one the server actually runs; if unsure, use \`list_resources\` to detect and confirm with the user.

4.2 **ox_lib?** (cache, callback, addCommand, locales, zones, etc.)
    Recommended: **yes** if the server has \`ox_lib\` started; it removes a lot of boilerplate.

4.3 **oxmysql?** (DB persistence)
    - **A) None** — in-memory only.
    - **B) Yes** — list the tables the resource will own (one row per table: name + columns + purpose).

    Recommended: **A** unless the resource owns persistent state across restarts.

### 5. UI

5.1 **Does the resource need a UI?**
    - **A) None** — server-only or chat-driven.
    - **B) Yes**

    Recommended: ask the user; the default depends entirely on the resource purpose.

5.2 **If B — UI stack:**
    - **A) Pure** — single \`html/index.html\` + \`app.js\` + \`style.css\`. No build step. Good for: modals, simple HUDs.
    - **B) Framework with Vite** — separate \`web/\` source tree, \`npm run build\` outputs to \`html/\`.

    Recommended: **A** if the UI is <300 LOC; otherwise **B**.

5.3 **If 5.2 = B (framework):**

    5.3.1 **Which framework?**
      - **A) Vue 3** (Composition API + SFC)
      - **B) React 18**
      - **C) Svelte 5**
      - **D) Solid**
      - **E) Preact**

      Recommended: **A) Vue 3** for FiveM NUI — smallest runtime, good DX, large existing FiveM community example pool.

    5.3.2 **State management?**
      - **A) Built-in** (ref/signals/useState)
      - **B) Pinia** (Vue) / **Zustand** (React) / **Svelte stores** / **Solid stores**
      - **C) None — derive from props/events only**

      Recommended: **A** under 5 components, **B** above.

    5.3.3 **CSS approach?**
      - **A) Plain CSS** in one file
      - **B) Scoped CSS** (SFC \`<style scoped>\`)
      - **C) Tailwind**
      - **D) UnoCSS**

      Recommended: **B** for Vue, **C/D** if the user wants utility-first.

    5.3.4 **Animations?**
      - **A) None**
      - **B) CSS transitions only**
      - **C) Vue \`<Transition>\` / Framer Motion / Svelte transitions**
      - **D) GSAP** for complex sequences.

      Recommended: **B**; bump to **C** only if the UI has timed sequences.

    5.3.5 **Form validation / data fetching libs?**
      - **A) None**
      - **B) Hand-rolled validators + native fetch wrappers**
      - **C) Zod / Valibot + custom fetch hook**

      Recommended: **B** unless forms are the main feature.

    5.3.6 **Icons?**
      - **A) None**
      - **B) Inline SVG**
      - **C) Lucide / Heroicons**
      - **D) Phosphor**

      Recommended: **B** for one or two icons, **C** for >5.

5.4 **Open key / command?**
    Recommended: **F6 + \`/<resource_name>\`** chat command. Confirm with user — F6 may clash with other resources on their server.

5.5 **NUI focus model?**
    - **A) Modal** — cursor freed, game input blocked while open.
    - **B) Overlay** — passive HUD, never takes focus.
    - **C) Hybrid** — overlay by default, modal when interaction needed.

    Recommended: **A** for menus/forms, **B** for HUDs.

### 6. Lifecycle behavior

6.1 **What should happen on resource start?**
    Recommended: print one banner line and register handlers. No automatic side effects until first interaction.

6.2 **What should happen on player drop?**
    Recommended: clean up any per-player state to avoid memory leaks; confirm with user what state the resource holds per player.

6.3 **What should happen on resource stop?**
    Recommended: persist (if oxmysql is enabled) and emit a graceful shutdown event for clients.

### 7. Audit + security

7.1 **Any verbs the user wants logged?** (e.g. money grants, admin actions)
    Recommended: log every mutating action through \`print\` with structured fields; agent_api's audit log captures the call but per-action logs help in-game admins.

7.2 **Rate limit on user-initiated events?**
    Recommended: a one-per-second per-player throttle on any spam-able event (chat send, button click that triggers server work).

### 8. Confirmation

8.1 Replay everything as a markdown checklist. Example shape:

    \`\`\`
    Ready to scaffold \`my_resource\`:
    - layout: multi-file (server/, client/, shared/, config/)
    - framework: ESX + ox_lib (+ oxmysql for table \`my_resource_logs\`)
    - UI: Vue 3 + Pinia + scoped CSS + Vue Transitions; F6 + /myres; modal
    - lifecycle: print banner, drop-cleanup yes, stop persist yes
    - audit: log money grants + admin force-stop
    - throttle: 1 req/s on \`my_resource:doThing\`
    \`\`\`

8.2 Ask: "Confirm to scaffold? (ok / cancel / edit <number>)"
    - "ok" → proceed.
    - "edit N" → re-ask question N, then return to confirmation.
    - "cancel" → stop, do not scaffold.

---

## Scaffolding phase (only after confirmed)

1. Call \`create_resource({ name, description, author })\`.
2. Call \`refresh_resources({ waitMs: 700 })\` so FiveM picks up the folder.
3. Call \`write_file\` for each planned file. Use \`createDirs: true\` for first write into any subfolder. Order: fxmanifest, config/*, shared/*, server/*, client/*, html/*, README.md.
4. Call \`ensure_resource({ name, timeoutMs: 5000 })\`.
5. If \`stateAfter\` is not \`started\`, immediately call \`tail_console({ lines: 50 })\`, find the error, propose a single-file fix, ask the user before re-writing.
6. Print a final summary listing every file written, the open key, and the next thing the user should do.

---

## Begin

Start with question **1.1 — Resource name**. Do not skip ahead. Do not offer to write code yet.
`;

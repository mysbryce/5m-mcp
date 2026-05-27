# Contributing to agent_api

Thanks for the interest. This guide covers the development workflow, the bar a contribution needs to meet, and the few extra rules that come with the fact that `agent_api` runs against a live FiveM server.

Before you start, please read [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md). Project license is [PolyForm Noncommercial 1.0.0](./LICENSE) — commercial use requires a separate agreement; everything else (forking, modifying, redistributing, running a public server on top of it) is fine as long as attribution is preserved.

Repository: <https://github.com/mysbryce/5m-mcp>

---

## Quick links

- Bug? → [open an issue](https://github.com/mysbryce/5m-mcp/issues) (use the "bug" label).
- Idea? → [start a discussion](https://github.com/mysbryce/5m-mcp/discussions) before writing code.
- **Security issue** → email **bubble.town2026@gmail.com** privately first. Do not open a public issue for sandbox bypasses, auth flaws, or anything that lets a caller escape the readonly/blocklist gates.

---

## Dev environment

You need:

- Node.js 20+ (the resource bundles target Node 16 for runtime parity with FiveM's embedded V8, but the build toolchain itself uses modern Node).
- A running FiveM server you can break. **Never test against a production server.**
- Recommended: txAdmin so you can `restart agent_api` from the web console.

```sh
git clone https://github.com/mysbryce/5m-mcp.git
cd 5m-mcp
npm install
npm run watch                  # rebuilds dist/*.js on save
```

Link the repo into a FiveM server once:

```pwsh
pwsh -File scripts/dev-link.ps1 -ServerRoot <txdata base>
```

That creates an NTFS junction at `<server>/resources/[agent]/agent_api → this repo`. After `npm run watch` rebuilds `dist/`, you just need `restart agent_api` in the FiveM console to pick the change up.

---

## Workflow

1. **Open an issue first** for anything bigger than a typo or one-liner. We'd rather refuse a design early than reject a finished PR.
2. **Branch from `main`** — use a short topic name: `fix/router-cors`, `feat/qbcore-plugin`.
3. **Keep PRs small.** One concern per PR. If you find yourself touching three different subsystems, split it.
4. **Write commits in [Conventional Commits](https://www.conventionalcommits.org/) style.** Look at the existing log for examples:
   ```
   feat(plugins): add qbcore bridge
   fix(sandbox): allow trailing slash in write root
   refactor(http): extract reply helper
   docs: clarify ACE requirements
   ```
5. **`npm run check` must pass.** This runs `typecheck + lint + fmt:check`. The pre-commit hook does not auto-fix — run `npm run fmt` + `npm run lint:fix` yourself.
6. **`npm run smoke` must pass against a live server.** If your change touches the HTTP surface, also extend `scripts/smoke.mjs` so the regression doesn't reappear silently.
7. **Open the PR against `main`.** Fill in:
   - what the change is
   - why (link the issue)
   - what you tested (smoke output, any new manual checks)
   - any new convars / new tools / new error codes

---

## Code style

- TypeScript, strict mode, no `any` unless commenting why.
- Format: oxfmt — 2 space, single quote, semicolons, trailing comma all, lf.
- Lint: oxlint — `correctness=error`, `suspicious=warn`, `perf=warn`.
- Use the `Envelope<T>` return shape for every tool handler. New error codes go in `src/server/errors/codes.ts` with a matching HTTP status in `HTTP_STATUS`.
- No comments unless the **why** is non-obvious. The code should be the documentation.

---

## Adding a new plugin

Plugins live under `src/server/plugins/<name>/`. Minimum viable plugin:

```ts
// src/server/plugins/myname/index.ts
import { z } from 'zod';
import { err, ok } from '../../util/envelope';
import { Plugin } from '../types';
import { isResourceStarted } from '../helpers';

export const mynamePlugin: Plugin = {
  name: 'myname',
  description: 'one-line summary',
  detect: () => isResourceStarted('the_target_resource'),
  install: ({ register, convars }) => {
    register({
      name: 'myname_do_thing',
      description: 'agent-facing one-line description',
      input: z.object({ /* ... */ }).strict(),
      handler: async (input, ctx) => ok({ /* ... */ }),
    });
  },
};
```

Then push it into `ALL_PLUGINS` in `src/server/plugins/index.ts`. The loader handles:

- detection via `GetResourceState`
- explicit opt-out via `agent_api_plugin_<name>_enabled false`
- snapshotting registered tool names for `list_plugins`

If your plugin exposes a generic call surface (like `esx_call_player` / `oxlib_call`), use the helpers in `src/server/plugins/dynamic.ts` (`isAllowed`, `safeSerialize`, `csvSet`, `classifyMethod`) so the readonly + blocklist semantics match the rest of the project.

---

## Adding a new tool

1. Pick a snake_case name (`<area>_<verb>` ideally).
2. Add zod input schema with `.strict()`.
3. Return `Envelope<T>` — `ok({...})` or `err('CODE', 'message', details?)`.
4. Mutating? Wrap with `withLock(resourceName, () => ...)` from `runtime/locks.ts`.
5. Touches the filesystem outside a resource? Go through `fs/sandbox.ts` — don't reinvent the check.
6. Extend `scripts/smoke.mjs` with at least one OK probe and one expected-reject probe.

---

## Adding a new error code

`src/server/errors/codes.ts`:

```ts
export const ErrorCode = {
  // ...
  YOUR_NEW_CODE: 'YOUR_NEW_CODE',
};
export const HTTP_STATUS: Record<ErrorCodeType, number> = {
  // ...
  YOUR_NEW_CODE: 403, // pick the right HTTP status
};
```

The map MUST cover every code. The TypeScript compiler enforces this.

---

## Live-server safety rules

`agent_api` can do real damage on a live server. When testing your own changes, please:

1. **Never run smoke or a teardown script against a production server.** Spin up your own dev server or txAdmin recipe.
2. **Do not commit `dist/.agent_token` or `dist/audit.log`.** They're already gitignored.
3. **Do not blast every `client_call_native` against a real player.** Use a throwaway test character on a dev server.
4. **If a contribution adds a new mutating surface (write_file extension, new lifecycle verb, new SQL statement type),** the PR description must list the threat model and any new convar gates.
5. **Found a sandbox bypass?** Email it first. Don't drop a PoC in a public issue.

---

## Release checklist (maintainer)

- [ ] `npm run check && npm run smoke` both pass green
- [ ] Bump `version` in `package.json` and `fxmanifest.lua`
- [ ] Update `CHANGELOG.md`
- [ ] `npm run generate:resource` → upload `out/agent_api.zip` to the GitHub release
- [ ] Tag `vX.Y.Z`, write release notes

---

Thanks again. PRs that move the project forward are appreciated even if we end up reshaping the approach during review.

# agent_api

FiveM resource that exposes safe local MCP tools so an agent can develop FiveM resources against a live server.

See [PLAN.md](./PLAN.md) for the full design.

## Status

Pre-alpha. M0 (scaffold) only.

## Dev

```sh
npm install
npm run watch       # rebuilds dist/*.js on save
npm run typecheck   # tsc --noEmit
```

Drop the folder into `resources/[agent]/agent_api` and `ensure agent_api`.

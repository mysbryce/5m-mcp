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

## ACE permissions

Lifecycle tools (`ensure/start/stop/restart/refresh/say`) call FiveM console
commands, which require ACE rights for the resource. Add to `server.cfg`:

```cfg
add_ace resource.agent_api command.ensure  allow
add_ace resource.agent_api command.start   allow
add_ace resource.agent_api command.stop    allow
add_ace resource.agent_api command.restart allow
add_ace resource.agent_api command.refresh allow
add_ace resource.agent_api command.say     allow
```

The token bootstrap banner reprints this block on every fresh install.

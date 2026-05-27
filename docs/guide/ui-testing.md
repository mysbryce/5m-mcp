# Live UI testing

For any resource with a NUI surface, the agent can iterate the design in a tight loop:

1. ask you to opt in as a test subject
2. ask you to open the UI in-game
3. screenshot the live NUI render
4. view the PNG directly
5. propose changes, write them, restart the resource
6. ask you to reopen the UI, loop

The agent never crashes the game or kicks anyone in this loop.

## Mandatory player consent

```
/agent_test_optin
```

The player types this in chat in-game. The server logs:

```
[agent_api] opt-in: serverId=1 name=nurrrrq expires=2026-05-27T01:45:25.318Z
```

Default TTL: 30 minutes. Override via `agent_api_test_session_ttl_seconds`. Player can revoke with `/agent_test_optout` at any time. Disconnect drops the session immediately.

## Screenshot via CDP

`screenshot_nui` attaches to FiveM's running CEF over the Chrome DevTools Protocol on port 13172. No headless browser, no chromium download. The full Playwright stack isn't needed.

```jsonc
// agent calls:
screenshot_nui({ resource: "my_resource" })

// returns:
{
  "ok": true,
  "data": {
    "path": "<abs>/dist/screenshots/nui-<ts>-<rand>.png",
    "bytes": 48165,
    "mode": "isolate",
    "iframe": { "name": "my_resource", "found": true, "rect": { ... } },
    "hint": "Use the Read tool ... then call delete_screenshot."
  }
}
```

## Capture modes

| `mode` | Behaviour |
| --- | --- |
| `isolate` (default with `resource`) | Hide every other resource iframe, capture full root, restore originals. Cleanest result. |
| `clip` | Leave siblings visible; crop the PNG to the iframe rect. |
| `full` (default without `resource`) | Capture the entire root overlay. Useful if you want to verify multiple HUDs interact correctly. |

Isolation works because FiveM mounts every resource's `ui_page` as `<iframe name="<resource_name>">` inside `nui://game/ui/root.html`. The agent runs a small `Runtime.evaluate` call before screenshotting to set `display:none` on siblings; a `try/finally` restores them after — even if the screenshot fails.

## What the screenshot captures

- **Yes:** The CEF NUI overlay layer (HTML, CSS, including transparency).
- **No:** The GTA V game frame underneath. That's GPU-composited and not part of the CEF surface.

So a typical screenshot is your UI on a transparent (rendered grey) background. That's normal — it's how the NUI compositor works.

## Clean up

Always pair a screenshot with a delete:

```jsonc
delete_screenshot({ path: "<the path you got>" })
```

The tool refuses paths outside `dist/screenshots/`, so the agent can't accidentally delete anything else.

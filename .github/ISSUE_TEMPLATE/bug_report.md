---
name: Bug report
about: Something works wrong against a real FiveM server.
title: '[bug] '
labels: bug
assignees: ''
---

## Summary

<!-- One sentence: what happened, what you expected. -->

## Repro

1.
2.
3.

## What I saw

```
(paste relevant console output, smoke output, or HTTP response)
```

## What I expected

## Environment

- agent_api version (from `package.json` or fxmanifest):
- FiveM build (artifact number):
- Node version (if relevant):
- OS:
- Other resources running that may matter (es_extended, ox_lib, oxmysql versions):

## Audit log line (if any)

```jsonl
(grep dist/audit.log for the failing call — REDACT real player names, identifiers, tokens)
```

## Notes

<!-- Anything else worth knowing. -->

---

**Reminder:** never paste a real `x-agent-token`, a real player license, or any chat content from real users. Rotate the token first (`rm dist/.agent_token && restart agent_api`) before sharing logs.

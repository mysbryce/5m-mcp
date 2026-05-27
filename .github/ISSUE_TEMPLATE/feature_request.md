---
name: Feature request
about: A new tool, plugin, convar, or workflow.
title: '[feat] '
labels: enhancement
assignees: ''
---

## Problem

<!-- What can't you do today? Concrete user story preferred. -->

## Proposed shape

<!-- Sketch the new tool / convar / API. zod schema if it's a tool. -->

```ts
register({
  name: '...',
  description: '...',
  input: z.object({}),
  handler: async (input, ctx) => ok({}),
});
```

## Why this surface

<!-- Why a new tool vs extending an existing one? Why a new plugin vs reusing -->
<!-- esx_call_player / oxlib_call? -->

## Threat model

<!-- What's the worst a caller can do with this? -->
<!-- Does it need readonly gating? Sandbox? New convar? -->

## Alternatives considered

## Willing to PR?

- [ ] Yes
- [ ] No, just an idea

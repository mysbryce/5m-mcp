#!/usr/bin/env node
"use strict";

// src/bin/mcp-stdio.ts
var url = process.env.AGENT_API_URL ?? "http://127.0.0.1:30120/agent_api/mcp";
var token = process.env.AGENT_API_TOKEN;
if (!token) {
  process.stderr.write("[mcp-stdio] AGENT_API_TOKEN is required\n");
  process.exit(1);
}
function logErr(msg) {
  process.stderr.write(`[mcp-stdio] ${msg}
`);
}
async function forward(frame) {
  if (!frame.trim()) return;
  let parsed;
  try {
    parsed = JSON.parse(frame);
  } catch (e) {
    logErr(`bad JSON frame from stdin: ${e.message}`);
    return;
  }
  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-agent-token": token
      },
      body: JSON.stringify(parsed)
    });
  } catch (e) {
    logErr(`fetch failed: ${e.message}`);
    return;
  }
  if (res.status === 202) {
    return;
  }
  const text = await res.text();
  if (!text) return;
  process.stdout.write(text + "\n");
}
var pending = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  pending += chunk;
  let idx;
  while ((idx = pending.indexOf("\n")) >= 0) {
    const line = pending.slice(0, idx);
    pending = pending.slice(idx + 1);
    void forward(line);
  }
});
process.stdin.on("end", () => {
  if (pending.trim()) void forward(pending);
});
process.stdin.on("error", (e) => {
  logErr(`stdin error: ${e.message}`);
  process.exit(1);
});
logErr(`bridge ready -> ${url}`);

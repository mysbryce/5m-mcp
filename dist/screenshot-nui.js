#!/usr/bin/env node
"use strict";

// src/bin/screenshot-nui.ts
var import_node_fs = require("node:fs");
var import_node_path = require("node:path");
function report(payload) {
  process.stdout.write(JSON.stringify(payload) + "\n");
}
function isLikelyNui(url) {
  const u = url.toLowerCase();
  if (u.startsWith("devtools://")) return false;
  if (u.startsWith("chrome://")) return false;
  if (u.startsWith("chrome-untrusted://")) return false;
  if (u === "about:blank") return false;
  return true;
}
async function listTargets(cdpUrl) {
  const r = await fetch(`${cdpUrl.replace(/\/$/, "")}/json`);
  if (!r.ok) throw new Error(`CDP /json returned ${r.status}`);
  const arr = await r.json();
  return arr.filter((p) => p.type === "page" && !!p.webSocketDebuggerUrl);
}
var CdpClient = class {
  ws;
  nextId = 1;
  pending = /* @__PURE__ */ new Map();
  constructor(wsUrl) {
    const WS = globalThis.WebSocket;
    if (!WS) throw new Error("WebSocket not available (need Node 22+).");
    this.ws = new WS(wsUrl);
    this.ws.addEventListener("message", (ev) => {
      try {
        const msg = JSON.parse(typeof ev.data === "string" ? ev.data : "");
        if (typeof msg.id !== "number") return;
        const cb = this.pending.get(msg.id);
        if (cb) {
          this.pending.delete(msg.id);
          cb(msg);
        }
      } catch {
      }
    });
  }
  ready(timeoutMs) {
    return new Promise((resolve, reject) => {
      if (this.ws.readyState === 1) {
        resolve();
        return;
      }
      const t = setTimeout(() => reject(new Error("ws open timeout")), timeoutMs);
      this.ws.addEventListener("open", () => {
        clearTimeout(t);
        resolve();
      });
      this.ws.addEventListener("error", (e) => {
        clearTimeout(t);
        const msg = e.message ?? "unknown";
        reject(new Error(`ws error: ${msg}`));
      });
    });
  }
  send(method, params = {}, timeoutMs = 1e4) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`CDP ${method} timed out after ${timeoutMs}ms`));
      }, timeoutMs);
      this.pending.set(id, (msg) => {
        clearTimeout(t);
        if (msg.error) reject(new Error(`${method}: ${msg.error.message}`));
        else resolve(msg.result);
      });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  close() {
    try {
      this.ws.close();
    } catch {
    }
  }
};
async function findIframeRect(client, name) {
  var _a;
  const expr = `(() => {
    const sel = ${JSON.stringify(`iframe[name="${name.replaceAll('"', '\\"')}"]`)};
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  })()`;
  const res = await client.send("Runtime.evaluate", {
    expression: expr,
    returnByValue: true
  });
  return ((_a = res.result) == null ? void 0 : _a.value) ?? null;
}
async function hideSiblingIframes(client, keepName) {
  var _a;
  const expr = `(() => {
    const keep = ${JSON.stringify(keepName)};
    const hidden = [];
    for (const f of document.querySelectorAll('iframe')) {
      if (f.getAttribute('name') === keep) continue;
      f.dataset.agentApiPrevDisplay = f.style.display || '';
      f.style.display = 'none';
      hidden.push(f.getAttribute('name') || '');
    }
    return hidden;
  })()`;
  const res = await client.send("Runtime.evaluate", {
    expression: expr,
    returnByValue: true
  });
  return ((_a = res.result) == null ? void 0 : _a.value) ?? [];
}
async function restoreSiblingIframes(client) {
  const expr = `(() => {
    for (const f of document.querySelectorAll('iframe')) {
      if (f.dataset.agentApiPrevDisplay !== undefined) {
        f.style.display = f.dataset.agentApiPrevDisplay;
        delete f.dataset.agentApiPrevDisplay;
      }
    }
    return true;
  })()`;
  await client.send("Runtime.evaluate", { expression: expr, returnByValue: true }).catch(() => {
  });
}
async function main() {
  const outputPath = process.argv[2];
  const cdpUrl = process.argv[3] ?? "http://localhost:13172";
  const timeoutMs = Number(process.argv[4] ?? "15000");
  const targetFilter = (process.argv[5] ?? "").toLowerCase();
  const iframeName = process.argv[6] ?? "";
  const mode = (process.argv[7] ?? "isolate").toLowerCase();
  if (!outputPath) {
    report({
      ok: false,
      error: "usage: screenshot-nui <outputPath> [cdpUrl] [timeoutMs] [targetFilter] [iframeName] [mode=isolate|clip|full]"
    });
    process.exit(2);
  }
  try {
    (0, import_node_fs.mkdirSync)((0, import_node_path.dirname)(outputPath), { recursive: true });
  } catch (e) {
    report({ ok: false, error: `mkdir failed: ${e.message}` });
    process.exit(2);
  }
  let targets;
  try {
    targets = await listTargets(cdpUrl);
  } catch (e) {
    report({ ok: false, error: `cannot reach CDP at ${cdpUrl}: ${e.message}` });
    process.exit(3);
  }
  if (targets.length === 0) {
    report({
      ok: false,
      error: `no page targets exposed by ${cdpUrl}. Ensure the FiveM client is running.`
    });
    process.exit(4);
  }
  let chosen;
  if (targetFilter) chosen = targets.find((p) => p.url.toLowerCase().includes(targetFilter));
  if (!chosen) chosen = targets.find((p) => isLikelyNui(p.url));
  if (!chosen) chosen = targets[0];
  const client = new CdpClient(chosen.webSocketDebuggerUrl);
  let restoredHidden = [];
  try {
    await client.ready(timeoutMs);
    let clip = null;
    let iframeReport;
    if (iframeName) {
      const rect = await findIframeRect(client, iframeName);
      iframeReport = { name: iframeName, found: !!rect, rect };
      if (!rect) {
        report({
          ok: false,
          error: `iframe[name="${iframeName}"] not found in ${chosen.url}. Is the resource's UI open?`,
          iframe: iframeReport
        });
        client.close();
        process.exit(7);
      }
      if (rect.width < 1 || rect.height < 1) {
        report({
          ok: false,
          error: `iframe[name="${iframeName}"] has zero size (${rect.width}x${rect.height}) \u2014 UI is likely hidden.`,
          iframe: iframeReport
        });
        client.close();
        process.exit(8);
      }
      if (mode === "clip") clip = rect;
      if (mode === "isolate") restoredHidden = await hideSiblingIframes(client, iframeName);
    }
    const screenshotParams = {
      format: "png",
      fromSurface: true
    };
    if (clip) {
      screenshotParams.clip = { ...clip, scale: 1 };
    }
    const res = await client.send(
      "Page.captureScreenshot",
      screenshotParams,
      timeoutMs
    );
    if (!res.data) throw new Error("CDP response missing result.data");
    const buffer = Buffer.from(res.data, "base64");
    (0, import_node_fs.writeFileSync)(outputPath, buffer);
    const bytes = (0, import_node_fs.statSync)(outputPath).size ?? buffer.length;
    report({
      ok: true,
      path: outputPath,
      bytes,
      mode,
      target: { url: chosen.url, title: chosen.title, id: chosen.id },
      candidates: targets.map((p) => ({ url: p.url, title: p.title })),
      iframe: iframeReport,
      hiddenSiblings: restoredHidden
    });
  } catch (e) {
    report({ ok: false, error: e instanceof Error ? e.message : String(e) });
    process.exit(5);
  } finally {
    if (restoredHidden.length > 0) await restoreSiblingIframes(client);
    client.close();
  }
}
void main();

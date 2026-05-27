#!/usr/bin/env node
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/bin/screenshot-nui.ts
var import_node_fs = require("node:fs");
var import_node_path = require("node:path");
async function loadChromium() {
  try {
    const pw = await import("playwright");
    return pw.chromium;
  } catch {
    throw new Error(
      "playwright is not installed. Run `npm install playwright` in the agent_api folder."
    );
  }
}
function report(payload) {
  process.stdout.write(JSON.stringify(payload) + "\n");
}
function isLikelyNui(url) {
  const u = url.toLowerCase();
  if (u.startsWith("devtools://")) return false;
  if (u.startsWith("chrome://")) return false;
  if (u === "about:blank") return false;
  if (u.startsWith("nui://")) return true;
  if (u.startsWith("https://cfx-nui-")) return true;
  if (u.startsWith("http://cfx-nui-")) return true;
  return true;
}
async function main() {
  const outputPath = process.argv[2];
  const cdpUrl = process.argv[3] ?? "http://localhost:13172";
  const timeoutMs = Number(process.argv[4] ?? "15000");
  const targetFilter = (process.argv[5] ?? "").toLowerCase();
  if (!outputPath) {
    report({ ok: false, error: "usage: screenshot-nui <outputPath> [cdpUrl] [timeoutMs] [targetFilter]" });
    process.exit(2);
  }
  try {
    (0, import_node_fs.mkdirSync)((0, import_node_path.dirname)(outputPath), { recursive: true });
  } catch (e) {
    report({ ok: false, error: `mkdir failed: ${e.message}` });
    process.exit(2);
  }
  let chromium;
  try {
    chromium = await loadChromium();
  } catch (e) {
    report({ ok: false, error: e.message });
    process.exit(3);
  }
  const overallTimer = setTimeout(() => {
    report({ ok: false, error: `timed out after ${timeoutMs}ms` });
    process.exit(6);
  }, timeoutMs);
  overallTimer.unref();
  let browser;
  try {
    browser = await chromium.connectOverCDP(cdpUrl);
    const allPages = [];
    for (const ctx of browser.contexts()) {
      for (const p of ctx.pages()) allPages.push(p);
    }
    if (allPages.length === 0) {
      report({
        ok: false,
        error: `no CEF pages exposed by ${cdpUrl}. Ensure FiveM was started with the CEF DevTools port (default 13172) and that an NUI surface is live.`
      });
      process.exit(4);
    }
    let chosen;
    if (targetFilter) {
      chosen = allPages.find((p) => p.url().toLowerCase().includes(targetFilter));
    }
    if (!chosen) chosen = allPages.find((p) => isLikelyNui(p.url()));
    if (!chosen) chosen = allPages[0];
    const url = chosen.url();
    const title = await chosen.title().catch(() => "");
    const buffer = await chosen.screenshot({ fullPage: true, type: "png" });
    (0, import_node_fs.writeFileSync)(outputPath, buffer);
    const bytes = (0, import_node_fs.statSync)(outputPath).size ?? buffer.length;
    clearTimeout(overallTimer);
    report({
      ok: true,
      path: outputPath,
      bytes,
      target: { url, title },
      candidates: allPages.map((p) => p.url())
    });
  } catch (e) {
    clearTimeout(overallTimer);
    report({ ok: false, error: e instanceof Error ? e.message : String(e) });
    process.exit(5);
  } finally {
    try {
      await (browser == null ? void 0 : browser.close());
    } catch {
    }
  }
}
void main();

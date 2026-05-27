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
      "playwright is not installed. Run `npm install playwright && npx playwright install chromium` in the agent_api resource folder."
    );
  }
}
function report(payload) {
  process.stdout.write(JSON.stringify(payload) + "\n");
}
async function main() {
  const outputPath = process.argv[2];
  const devtoolsUrl = process.argv[3] ?? "http://localhost:13172/";
  const timeoutMs = Number(process.argv[4] ?? "15000");
  if (!outputPath) {
    report({ ok: false, error: "usage: screenshot-nui <outputPath> [devtoolsUrl] [timeoutMs]" });
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
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    const indexPage = await ctx.newPage();
    indexPage.setDefaultTimeout(timeoutMs);
    await indexPage.goto(devtoolsUrl, { waitUntil: "domcontentloaded" });
    const links = await indexPage.locator("a").all();
    if (links.length === 0) {
      report({
        ok: false,
        error: `no <a> found at ${devtoolsUrl} \u2014 is the FiveM CEF DevTools enabled? Run \`+set ui_useDirectInput true\` and \`+set ui_devtools true\` on server start, or check the running clients have NUI surfaces.`
      });
      process.exit(4);
    }
    const href = await links[0].getAttribute("href");
    if (!href) {
      report({ ok: false, error: "first <a> has no href." });
      process.exit(4);
    }
    const target = new URL(href, devtoolsUrl).toString();
    const devPage = await ctx.newPage();
    devPage.setDefaultTimeout(timeoutMs);
    await devPage.goto(target, { waitUntil: "domcontentloaded" });
    await devPage.waitForLoadState("networkidle", { timeout: timeoutMs }).catch(() => void 0);
    await devPage.waitForTimeout(800);
    const buffer = await devPage.screenshot({ fullPage: true, type: "png" });
    (0, import_node_fs.writeFileSync)(outputPath, buffer);
    report({
      ok: true,
      path: outputPath,
      bytes: buffer.length,
      devtoolsUrl,
      target
    });
  } catch (e) {
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

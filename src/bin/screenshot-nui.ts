/**
 * Standalone screenshot helper. Spawned by the screenshot_nui tool.
 *
 * Argv:
 *   1. outputPath  — absolute path to write the PNG to
 *   2. devtoolsUrl — default http://localhost:13172/
 *   3. timeoutMs   — default 15000
 *
 * Behaviour:
 *   - Launch chromium headless via @playwright/test or playwright.
 *   - Visit devtoolsUrl (FiveM's CEF DevTools index).
 *   - Find first <a>, follow its href (DevTools front-end for one NUI page).
 *   - Wait for the rendered NUI iframe to settle, then full-page screenshot.
 *   - Print one JSON line to stdout: { ok: true, path } or { ok: false, error }.
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

type PlaywrightChromium = {
  launch: (opts?: unknown) => Promise<unknown>;
};

async function loadChromium(): Promise<PlaywrightChromium> {
  try {
    const pw = (await import('playwright')) as { chromium: PlaywrightChromium };
    return pw.chromium;
  } catch {
    throw new Error(
      'playwright is not installed. Run `npm install playwright && npx playwright install chromium` in the agent_api resource folder.',
    );
  }
}

function report(payload: Record<string, unknown>): void {
  process.stdout.write(JSON.stringify(payload) + '\n');
}

async function main(): Promise<void> {
  const outputPath = process.argv[2];
  const devtoolsUrl = process.argv[3] ?? 'http://localhost:13172/';
  const timeoutMs = Number(process.argv[4] ?? '15000');

  if (!outputPath) {
    report({ ok: false, error: 'usage: screenshot-nui <outputPath> [devtoolsUrl] [timeoutMs]' });
    process.exit(2);
  }

  try {
    mkdirSync(dirname(outputPath), { recursive: true });
  } catch (e) {
    report({ ok: false, error: `mkdir failed: ${(e as Error).message}` });
    process.exit(2);
  }

  let chromium: PlaywrightChromium;
  try {
    chromium = await loadChromium();
  } catch (e) {
    report({ ok: false, error: (e as Error).message });
    process.exit(3);
  }

  let browser: any;
  try {
    browser = await chromium.launch({ headless: true });
    const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    const indexPage = await ctx.newPage();
    indexPage.setDefaultTimeout(timeoutMs);

    await indexPage.goto(devtoolsUrl, { waitUntil: 'domcontentloaded' });
    const links = await indexPage.locator('a').all();
    if (links.length === 0) {
      report({
        ok: false,
        error: `no <a> found at ${devtoolsUrl} — is the FiveM CEF DevTools enabled? Run \`+set ui_useDirectInput true\` and \`+set ui_devtools true\` on server start, or check the running clients have NUI surfaces.`,
      });
      process.exit(4);
    }
    const href = await links[0].getAttribute('href');
    if (!href) {
      report({ ok: false, error: 'first <a> has no href.' });
      process.exit(4);
    }
    const target = new URL(href, devtoolsUrl).toString();

    const devPage = await ctx.newPage();
    devPage.setDefaultTimeout(timeoutMs);
    await devPage.goto(target, { waitUntil: 'domcontentloaded' });
    await devPage.waitForLoadState('networkidle', { timeout: timeoutMs }).catch(() => undefined);
    await devPage.waitForTimeout(800);

    const buffer = await devPage.screenshot({ fullPage: true, type: 'png' });
    writeFileSync(outputPath, buffer);

    report({
      ok: true,
      path: outputPath,
      bytes: buffer.length,
      devtoolsUrl,
      target,
    });
  } catch (e) {
    report({ ok: false, error: e instanceof Error ? e.message : String(e) });
    process.exit(5);
  } finally {
    try {
      await browser?.close();
    } catch {
      // ignore
    }
  }
}

void main();

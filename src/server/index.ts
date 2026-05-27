import { loadConvars } from './config/convars';
import { logTokenBanner, resolveToken } from './config/token';
import { RingBuffer, installConsoleListener } from './console/buffer';
import { installHttpRouter } from './http/router';
import { registerGetResourceState } from './tools/getResourceState';
import { registerHealth } from './tools/health';
import { registerListResources } from './tools/listResources';
import { registerReadFile } from './tools/readFile';
import { registerTailConsole } from './tools/tailConsole';

const VERSION = '0.0.1';
const RESOURCE_NAME = GetCurrentResourceName();

function main(): void {
  const convars = loadConvars();
  const tokenInfo = resolveToken(convars.rawToken);
  logTokenBanner(tokenInfo.token, tokenInfo.generated);

  const consoleBuffer = new RingBuffer(convars.consoleBufferLines);
  installConsoleListener(consoleBuffer);

  registerHealth(VERSION);
  registerListResources();
  registerGetResourceState();
  registerReadFile();
  registerTailConsole();

  installHttpRouter({
    token: tokenInfo.token,
    ctx: { convars, console: consoleBuffer },
  });

  console.log(`[${RESOURCE_NAME}] up — v${VERSION} (M1)`);
  console.log(`[${RESOURCE_NAME}] HTTP ready at http://127.0.0.1:30120/${RESOURCE_NAME}/`);
}

main();

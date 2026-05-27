import { loadConvars } from './config/convars';
import { logTokenBanner, resolveToken } from './config/token';
import { RingBuffer, installConsoleListener } from './console/buffer';
import { installHttpRouter } from './http/router';
import { registerCreateResource } from './tools/createResource';
import { registerGetResourceState } from './tools/getResourceState';
import { registerHealth } from './tools/health';
import {
  registerEnsureResource,
  registerRestartResource,
  registerStartResource,
  registerStopResource,
} from './tools/lifecycle';
import { registerListResources } from './tools/listResources';
import { registerReadFile } from './tools/readFile';
import { registerRefreshResources } from './tools/refreshResources';
import {
  registerGetPlayerState,
  registerListPlayers,
  registerRegisterTestSubject,
  registerSendChat,
  registerTriggerClientEvent,
  registerUnregisterTestSubject,
  registerWaitForClientEvent,
} from './tools/players';
import { registerClientCallNative, registerClientListNatives } from './tools/clientNative';
import { registerServerCallNative, registerServerListNatives } from './tools/serverNative';
import { registerRunCommand } from './tools/runCommand';
import { registerTailConsole } from './tools/tailConsole';
import { registerWriteFile } from './tools/writeFile';
import { installOptInCommands } from './players/optin';
import { installProbeListener } from './players/probes';
import { ALL_PLUGINS } from './plugins';
import { loadPlugins, logPluginStatuses } from './plugins/loader';
import { registerListPlugins, setPluginSnapshot } from './tools/plugins';

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
  registerWriteFile();
  registerCreateResource();
  registerRefreshResources();
  registerEnsureResource();
  registerStartResource();
  registerStopResource();
  registerRestartResource();
  registerRunCommand();
  registerListPlayers();
  registerRegisterTestSubject();
  registerUnregisterTestSubject();
  registerGetPlayerState();
  registerTriggerClientEvent();
  registerSendChat();
  registerWaitForClientEvent();
  registerClientCallNative();
  registerClientListNatives();
  registerServerCallNative();
  registerServerListNatives();

  installOptInCommands(convars.testSessionTtlSeconds);
  installProbeListener();

  registerListPlugins();
  const pluginSnapshot = loadPlugins(ALL_PLUGINS, convars);
  setPluginSnapshot(pluginSnapshot);
  logPluginStatuses(pluginSnapshot);

  installHttpRouter({
    token: tokenInfo.token,
    ctx: { convars, console: consoleBuffer },
  });

  console.log(`[${RESOURCE_NAME}] up — v${VERSION} (M6)`);
  console.log(`[${RESOURCE_NAME}] HTTP ready at http://127.0.0.1:30120/${RESOURCE_NAME}/`);
}

main();

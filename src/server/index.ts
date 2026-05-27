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
import { registerRunShell } from './tools/runShell';
import { registerScreenshotNui } from './tools/screenshotNui';
import { registerRunCommand } from './tools/runCommand';
import { registerTailConsole } from './tools/tailConsole';
import { registerWriteFile } from './tools/writeFile';
import { registerEditFile } from './tools/edit';
import { registerExploreTools } from './tools/explore';
import { registerWaitForConsole } from './tools/waitForConsole';
import { registerManageFiles } from './tools/manage';
import { registerGetResourceManifest } from './tools/manifest';
import { registerNuiInteract } from './tools/nuiInteract';
import { registerScanErrors } from './tools/scanErrors';
import { listResources } from './runtime/resources';
import { registerResource } from './mcp/resources';
import { enabledPreferences } from './dashboard/preferences';
import { listSkills } from './dashboard/skills';
import { installOptInCommands } from './players/optin';
import { installProbeListener } from './players/probes';
import { ALL_PLUGINS } from './plugins';
import { loadPlugins, logPluginStatuses } from './plugins/loader';
import { registerListPlugins, setPluginSnapshot } from './tools/plugins';
import { registerPrompt } from './mcp/prompts';
import { scaffoldFivemPrompt } from './mcp/prompts/scaffoldFivem';
import { registerScaffoldFivemWorkflow } from './tools/scaffoldWorkflow';
import { registerListPreferences } from './tools/preferences';
import { registerListSkills } from './tools/skills';
import { applyPersistedOverrides } from './dashboard/permissions';

const VERSION = '0.4.0';
const RESOURCE_NAME = GetCurrentResourceName();

function main(): void {
  // Apply any dashboard-saved permission overrides before reading convars.
  applyPersistedOverrides();

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
  registerEditFile();
  registerManageFiles();
  registerExploreTools();
  registerWaitForConsole();
  registerScanErrors();
  registerGetResourceManifest();
  registerNuiInteract();
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
  registerRunShell();
  registerScreenshotNui();

  installOptInCommands(convars.testSessionTtlSeconds);
  installProbeListener();

  registerPrompt(scaffoldFivemPrompt);
  registerScaffoldFivemWorkflow();
  registerListPreferences();
  registerListSkills();

  registerResource({
    uri: 'agent://console',
    name: 'Console (recent)',
    description: 'Last 200 lines from the server console ring buffer',
    mimeType: 'application/json',
    read: () => JSON.stringify(consoleBuffer.tail({ lines: 200 }), null, 2),
  });
  registerResource({
    uri: 'agent://resources',
    name: 'Resources',
    description: 'Every registered FiveM resource and its state',
    mimeType: 'application/json',
    read: () => JSON.stringify(listResources(), null, 2),
  });
  registerResource({
    uri: 'agent://preferences',
    name: 'Preferences',
    description: 'Active development preferences (structure / coding / ui-design)',
    mimeType: 'application/json',
    read: () => JSON.stringify(enabledPreferences(), null, 2),
  });
  registerResource({
    uri: 'agent://skills',
    name: 'Skills',
    description: 'User-uploaded custom skills with triggers and bodies',
    mimeType: 'application/json',
    read: () => JSON.stringify(listSkills(), null, 2),
  });

  registerListPlugins();
  const pluginSnapshot = loadPlugins(ALL_PLUGINS, convars);
  setPluginSnapshot(pluginSnapshot);
  logPluginStatuses(pluginSnapshot);

  installHttpRouter({
    token: tokenInfo.token,
    ctx: { convars, console: consoleBuffer },
    reloadConvars: () => {
      Object.assign(convars, loadConvars());
    },
  });

  console.log(`[${RESOURCE_NAME}] up — v${VERSION} (M6)`);
  console.log(`[${RESOURCE_NAME}] HTTP ready at http://127.0.0.1:30120/${RESOURCE_NAME}/`);
  console.log(`[${RESOURCE_NAME}] Dashboard at http://127.0.0.1:30120/${RESOURCE_NAME}/dashboard`);
}

main();

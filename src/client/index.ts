import { installClientProbes } from './events';
import { installClientNativeBridge } from './native';

const RESOURCE_NAME = GetCurrentResourceName();
const VERSION = '0.5.0';

installClientProbes();
installClientNativeBridge();

console.log(`[${RESOURCE_NAME}] client up — v${VERSION} (M6)`);

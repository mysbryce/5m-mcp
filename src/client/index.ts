import { installClientProbes } from './events';

const RESOURCE_NAME = GetCurrentResourceName();
const VERSION = '0.0.1';

installClientProbes();

console.log(`[${RESOURCE_NAME}] client up — v${VERSION} (M5)`);

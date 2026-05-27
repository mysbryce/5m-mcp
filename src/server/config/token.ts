import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync, chmodSync } from 'node:fs';
import { join } from 'node:path';

const TOKEN_FILE = 'dist/.agent_token';
const PLACEHOLDER = 'change-me';

export type TokenInfo = {
  token: string;
  generated: boolean;
};

export function resolveToken(rawConvar: string): TokenInfo {
  const resourceRoot = GetResourcePath(GetCurrentResourceName());
  const tokenPath = join(resourceRoot, TOKEN_FILE);

  if (rawConvar && rawConvar !== PLACEHOLDER) {
    return { token: rawConvar, generated: false };
  }

  if (existsSync(tokenPath)) {
    const persisted = readFileSync(tokenPath, 'utf8').trim();
    if (persisted) return { token: persisted, generated: false };
  }

  const fresh = randomBytes(32).toString('hex');
  writeFileSync(tokenPath, fresh + '\n', 'utf8');
  try {
    chmodSync(tokenPath, 0o600);
  } catch {
    // Windows ignores mode; not fatal.
  }
  return { token: fresh, generated: true };
}

export function logTokenBanner(token: string, generated: boolean): void {
  const tag = `[${GetCurrentResourceName()}]`;
  if (!generated) {
    console.log(`${tag} Token loaded.`);
    return;
  }
  console.log(`${tag} No token configured. Generated new token.`);
  console.log(`${tag} Saved to: ${TOKEN_FILE}`);
  console.log(`${tag}`);
  console.log(`${tag} Add this to your Claude Code MCP config:`);
  console.log(`${tag}`);
  console.log(`${tag}   "agent_api": {`);
  console.log(`${tag}     "type": "http",`);
  console.log(`${tag}     "url": "http://127.0.0.1:30120/agent_api/mcp",`);
  console.log(`${tag}     "headers": { "x-agent-token": "${token}" }`);
  console.log(`${tag}   }`);
  console.log(`${tag}`);
  console.log(`${tag} For lifecycle tools, grant ACE permissions in server.cfg:`);
  console.log(`${tag}`);
  console.log(`${tag}   add_ace resource.${GetCurrentResourceName()} command.ensure  allow`);
  console.log(`${tag}   add_ace resource.${GetCurrentResourceName()} command.start   allow`);
  console.log(`${tag}   add_ace resource.${GetCurrentResourceName()} command.stop    allow`);
  console.log(`${tag}   add_ace resource.${GetCurrentResourceName()} command.restart allow`);
  console.log(`${tag}   add_ace resource.${GetCurrentResourceName()} command.refresh allow`);
  console.log(`${tag}   add_ace resource.${GetCurrentResourceName()} command.say     allow`);
  console.log(`${tag}`);
}

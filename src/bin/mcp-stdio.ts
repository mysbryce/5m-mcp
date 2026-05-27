const url = process.env.AGENT_API_URL ?? 'http://127.0.0.1:30120/agent_api/mcp';
const token = process.env.AGENT_API_TOKEN;

if (!token) {
  console.error('[mcp-stdio] AGENT_API_TOKEN is required');
  process.exit(1);
}

console.error(`[mcp-stdio] stub — would bridge stdio <-> ${url}`);
process.exit(0);

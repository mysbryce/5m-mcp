import { addOptIn, dropPlayer, getOptIn, removeOptIn } from './registry';
import { dropPlayer as dropSubject } from './subjects';

function chat(serverId: number, color: [number, number, number], text: string): void {
  emitNet('chat:addMessage', serverId, {
    color,
    args: ['[agent_api]', text],
  });
}

export function installOptInCommands(ttlSeconds: number): void {
  RegisterCommand(
    'agent_test_optin',
    (source: number) => {
      if (source === 0) {
        console.log('[agent_api] /agent_test_optin must be run by a player, not the console.');
        return;
      }
      const session = addOptIn(source, ttlSeconds);
      const minutes = Math.round(ttlSeconds / 60);
      chat(
        source,
        [120, 200, 120],
        `You are now a test subject for ${minutes} minutes. Type /agent_test_optout to revoke.`,
      );
      console.log(
        `[agent_api] opt-in: serverId=${source} name=${session.name} expires=${new Date(session.expiresAt).toISOString()}`,
      );
    },
    false,
  );

  RegisterCommand(
    'agent_test_optout',
    (source: number) => {
      if (source === 0) return;
      const had = removeOptIn(source);
      dropSubject(source);
      if (had) {
        chat(source, [200, 120, 120], 'Test subject opt-out confirmed.');
        console.log(`[agent_api] opt-out: serverId=${source}`);
      }
    },
    false,
  );

  RegisterCommand(
    'agent_test_status',
    (source: number) => {
      if (source === 0) return;
      const s = getOptIn(source);
      if (!s) {
        chat(source, [200, 200, 120], 'You are NOT a test subject.');
      } else {
        const left = Math.max(0, Math.floor((s.expiresAt - Date.now()) / 1000));
        chat(source, [120, 200, 200], `Opted in. ${left}s remaining.`);
      }
    },
    false,
  );

  on('playerDropped', () => {
    const source = (globalThis as { source?: number }).source;
    if (typeof source === 'number') {
      dropPlayer(source);
      dropSubject(source);
    }
  });
}

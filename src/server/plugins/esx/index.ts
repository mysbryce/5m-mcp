import { z } from 'zod';
import { err, ok } from '../../util/envelope';
import { Plugin } from '../types';
import { callExport, isResourceStarted, safeExport } from '../helpers';
import { csvSet, isAllowed, listCallable, safeSerialize } from '../dynamic';

const RESOURCE = 'es_extended';

type EsxSharedObject = Record<string, unknown> & {
  GetPlayerFromId: (serverId: number) => EsxPlayer | null;
  GetPlayers: () => number[];
};

type EsxPlayer = Record<string, unknown> & {
  source: number;
  identifier: string;
  getName?: () => string;
  getMoney?: () => number;
  getAccounts?: () => { name: string; money: number }[];
  getJob?: () => { name: string; grade: number; grade_name?: string };
  addMoney?: (n: number) => void;
  removeMoney?: (n: number) => void;
  addAccountMoney?: (account: string, n: number) => void;
  removeAccountMoney?: (account: string, n: number) => void;
  setJob?: (job: string, grade: number) => void;
};

let cachedEsx: EsxSharedObject | null = null;

function getEsx(): EsxSharedObject | null {
  if (cachedEsx) return cachedEsx;
  const obj = callExport<EsxSharedObject>(RESOURCE, 'getSharedObject', []);
  if (obj) cachedEsx = obj;
  return obj;
}

function snapshot(p: EsxPlayer): Record<string, unknown> {
  return {
    serverId: p.source,
    identifier: p.identifier,
    name: p.getName?.(),
    money: p.getMoney?.(),
    accounts: p.getAccounts?.() ?? null,
    job: p.getJob?.() ?? null,
  };
}

export const esxPlugin: Plugin = {
  name: 'esx',
  description: 'ESX Legacy framework — read player data, money, job, inventory ops.',
  detect: () => {
    const started = isResourceStarted(RESOURCE);
    if (!started.ok) return started;
    if (!safeExport(RESOURCE, 'getSharedObject')) {
      return { ok: false, reason: `${RESOURCE} export getSharedObject not callable` };
    }
    return { ok: true };
  },
  install: ({ register, convars }) => {
    register({
      name: 'esx_list_players',
      description: 'List all online ESX players with identifier, money, accounts, and job.',
      input: z.object({}).strict(),
      handler: async () => {
        const esx = getEsx();
        if (!esx) return err('INTERNAL', 'ESX shared object unavailable.');
        const ids = esx.GetPlayers();
        const players = ids
          .map((id) => esx.GetPlayerFromId(id))
          .filter((p): p is EsxPlayer => !!p)
          .map((p) => snapshot(p));
        return ok({ count: players.length, players });
      },
    });

    register({
      name: 'esx_get_player',
      description: 'Fetch one ESX player snapshot by server id.',
      input: z.object({ serverId: z.number().int().min(1) }).strict(),
      handler: async (input: { serverId: number }) => {
        const esx = getEsx();
        if (!esx) return err('INTERNAL', 'ESX shared object unavailable.');
        const p = esx.GetPlayerFromId(input.serverId);
        if (!p) return err('PLAYER_NOT_FOUND', `No ESX player for serverId ${input.serverId}.`);
        return ok(snapshot(p));
      },
    });

    if (convars.readonly) return;

    register({
      name: 'esx_add_money',
      description:
        'Add money to an ESX player. Pass account="cash"/"bank"/"black_money" or omit for primary money.',
      input: z
        .object({
          serverId: z.number().int().min(1),
          amount: z.number().int(),
          account: z.string().optional(),
        })
        .strict(),
      handler: async (input: { serverId: number; amount: number; account?: string }) => {
        const esx = getEsx();
        if (!esx) return err('INTERNAL', 'ESX shared object unavailable.');
        const p = esx.GetPlayerFromId(input.serverId);
        if (!p) return err('PLAYER_NOT_FOUND', `serverId ${input.serverId} not found.`);
        if (input.account) {
          if (input.amount >= 0) p.addAccountMoney?.(input.account, input.amount);
          else p.removeAccountMoney?.(input.account, -input.amount);
        } else {
          if (input.amount >= 0) p.addMoney?.(input.amount);
          else p.removeMoney?.(-input.amount);
        }
        return ok(snapshot(p));
      },
    });

    register({
      name: 'esx_set_job',
      description: 'Assign a job + grade to an ESX player.',
      input: z
        .object({
          serverId: z.number().int().min(1),
          job: z.string().min(1),
          grade: z.number().int().min(0),
        })
        .strict(),
      handler: async (input: { serverId: number; job: string; grade: number }) => {
        const esx = getEsx();
        if (!esx) return err('INTERNAL', 'ESX shared object unavailable.');
        const p = esx.GetPlayerFromId(input.serverId);
        if (!p) return err('PLAYER_NOT_FOUND', `serverId ${input.serverId} not found.`);
        p.setJob?.(input.job, input.grade);
        return ok(snapshot(p));
      },
    });

    register({
      name: 'esx_list_shared_methods',
      description:
        'Discover every callable method on the ESX shared object — use before esx_call_shared.',
      input: z.object({}).strict(),
      handler: async () => {
        const esx = getEsx();
        if (!esx) return err('INTERNAL', 'ESX shared object unavailable.');
        return ok({ methods: listCallable(esx) });
      },
    });

    register({
      name: 'esx_list_player_methods',
      description:
        'Discover every callable method on an xPlayer (e.g. getInventory, getJob, addMoney).',
      input: z.object({ serverId: z.number().int().min(1) }).strict(),
      handler: async (input: { serverId: number }) => {
        const esx = getEsx();
        if (!esx) return err('INTERNAL', 'ESX shared object unavailable.');
        const p = esx.GetPlayerFromId(input.serverId);
        if (!p) return err('PLAYER_NOT_FOUND', `serverId ${input.serverId} not found.`);
        return ok({ serverId: input.serverId, methods: listCallable(p) });
      },
    });

    const blocklist = csvSet('agent_api_plugin_esx_blocked_methods');

    register({
      name: 'esx_call_shared',
      description:
        'Call any method on the ESX shared object dynamically. ' +
        'Read-only methods (get/is/has/list/find/count/...) are always allowed. ' +
        'Mutating methods require agent_api_readonly=false. ' +
        'Methods listed in agent_api_plugin_esx_blocked_methods are always denied.',
      input: z
        .object({
          method: z.string().regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/),
          args: z.array(z.unknown()).optional(),
        })
        .strict(),
      handler: async (input: { method: string; args?: unknown[] }) => {
        const esx = getEsx();
        if (!esx) return err('INTERNAL', 'ESX shared object unavailable.');
        const guard = isAllowed(input.method, { readonly: convars.readonly, blocklist });
        if (!guard.ok) return err('COMMAND_NOT_ALLOWED', guard.reason);
        const fn = esx[input.method];
        if (typeof fn !== 'function') {
          return err(
            'INVALID_INPUT',
            `ESX.${input.method} is not a function on the shared object.`,
          );
        }
        try {
          const raw = await Promise.resolve((fn as Function).apply(esx, input.args ?? []));
          return ok({ method: input.method, result: safeSerialize(raw) });
        } catch (e) {
          return err('INTERNAL', e instanceof Error ? e.message : String(e));
        }
      },
    });

    register({
      name: 'esx_call_player',
      description:
        'Call any method on one xPlayer dynamically (e.g. getInventory, getAccount, setJob). ' +
        'Same read/write gating as esx_call_shared.',
      input: z
        .object({
          serverId: z.number().int().min(1),
          method: z.string().regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/),
          args: z.array(z.unknown()).optional(),
        })
        .strict(),
      handler: async (input: { serverId: number; method: string; args?: unknown[] }) => {
        const esx = getEsx();
        if (!esx) return err('INTERNAL', 'ESX shared object unavailable.');
        const player = esx.GetPlayerFromId(input.serverId);
        if (!player) {
          return err('PLAYER_NOT_FOUND', `serverId ${input.serverId} not found.`);
        }
        const guard = isAllowed(input.method, { readonly: convars.readonly, blocklist });
        if (!guard.ok) return err('COMMAND_NOT_ALLOWED', guard.reason);
        const fn = player[input.method];
        if (typeof fn !== 'function') {
          return err(
            'INVALID_INPUT',
            `xPlayer.${input.method} is not a function on player ${input.serverId}.`,
          );
        }
        try {
          const raw = await Promise.resolve((fn as Function).apply(player, input.args ?? []));
          return ok({
            serverId: input.serverId,
            method: input.method,
            result: safeSerialize(raw),
          });
        } catch (e) {
          return err('INTERNAL', e instanceof Error ? e.message : String(e));
        }
      },
    });
  },
};

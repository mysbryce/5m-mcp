import { z } from 'zod';
import { err, ok } from '../../util/envelope';
import { Plugin } from '../types';
import { callExport, isResourceStarted, safeExport } from '../helpers';

const RESOURCE = 'es_extended';

type EsxSharedObject = {
  GetPlayerFromId: (serverId: number) => EsxPlayer | null;
  GetPlayers: () => number[];
  GetExtendedPlayers?: () => EsxPlayer[];
};

type EsxPlayer = {
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
  addInventoryItem?: (item: string, count: number) => void;
  removeInventoryItem?: (item: string, count: number) => void;
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
  },
};

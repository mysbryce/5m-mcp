import { z } from 'zod';
import { err, ok } from '../../util/envelope';
import { Plugin } from '../types';
import { isResourceStarted, safeExport } from '../helpers';

const RESOURCE = 'oxmysql';

type OxMysqlExports = {
  query_async?: (query: string, params: unknown[], cb: (rows: unknown) => void) => void;
  execute_async?: (query: string, params: unknown[], cb: (affected: unknown) => void) => void;
  scalar_async?: (query: string, params: unknown[], cb: (value: unknown) => void) => void;
};

function callAsync<T>(method: keyof OxMysqlExports, query: string, params: unknown[]): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const fn = safeExport<OxMysqlExports[typeof method]>(RESOURCE, method);
    if (!fn) {
      reject(new Error(`oxmysql.${method} export missing`));
      return;
    }
    try {
      (fn as (q: string, p: unknown[], cb: (v: unknown) => void) => void)(query, params, (val) =>
        resolve(val as T),
      );
    } catch (e) {
      reject(e instanceof Error ? e : new Error(String(e)));
    }
  });
}

function firstWord(q: string): string {
  return q.trim().split(/\s+/)[0]?.toUpperCase() ?? '';
}

function readonlyMode(): boolean {
  const v = GetConvar('agent_api_plugin_oxmysql_readonly', 'true').toLowerCase();
  return v !== 'false' && v !== '0' && v !== 'no' && v !== 'off';
}

function statementAllowlist(): Set<string> {
  return new Set(
    GetConvar('agent_api_plugin_oxmysql_allow_statements', 'SELECT')
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean),
  );
}

function guardQuery(query: string): { ok: true } | { ok: false; reason: string } {
  const verb = firstWord(query);
  if (!verb) return { ok: false, reason: 'empty query' };
  if (readonlyMode() && verb !== 'SELECT') {
    return { ok: false, reason: `oxmysql is in readonly mode (only SELECT allowed, got ${verb})` };
  }
  if (!statementAllowlist().has(verb)) {
    return {
      ok: false,
      reason: `statement ${verb} is not in agent_api_plugin_oxmysql_allow_statements`,
    };
  }
  return { ok: true };
}

const QueryInput = z
  .object({
    query: z.string().min(1).max(10_000),
    params: z.array(z.unknown()).max(64).optional(),
    rowLimit: z.number().int().min(1).max(1000).optional(),
  })
  .strict();
type QueryInput = z.infer<typeof QueryInput>;

export const oxMysqlPlugin: Plugin = {
  name: 'oxmysql',
  description: 'oxmysql bridge — gated SQL. Defaults to SELECT-only via convars; off by default.',
  detect: () => {
    const started = isResourceStarted(RESOURCE);
    if (!started.ok) return started;
    if (!safeExport(RESOURCE, 'query_async')) {
      return { ok: false, reason: `${RESOURCE} export query_async missing` };
    }
    return { ok: true };
  },
  install: ({ register }) => {
    register({
      name: 'oxmysql_query',
      description:
        'Run a SELECT query and return rows. Statement type is restricted by ' +
        'agent_api_plugin_oxmysql_readonly (default true) and ' +
        'agent_api_plugin_oxmysql_allow_statements (default SELECT).',
      input: QueryInput,
      handler: async (input: QueryInput) => {
        const guard = guardQuery(input.query);
        if (!guard.ok) return err('COMMAND_NOT_ALLOWED', guard.reason);
        try {
          const rows = await callAsync<unknown[]>('query_async', input.query, input.params ?? []);
          const limit = input.rowLimit ?? 100;
          const trimmed = Array.isArray(rows) ? rows.slice(0, limit) : rows;
          return ok({
            rowCount: Array.isArray(rows) ? rows.length : null,
            truncated: Array.isArray(rows) && rows.length > limit,
            rows: trimmed,
          });
        } catch (e) {
          return err('INTERNAL', e instanceof Error ? e.message : String(e));
        }
      },
    });

    register({
      name: 'oxmysql_scalar',
      description: 'Run a query and return only the first column of the first row.',
      input: QueryInput,
      handler: async (input: QueryInput) => {
        const guard = guardQuery(input.query);
        if (!guard.ok) return err('COMMAND_NOT_ALLOWED', guard.reason);
        try {
          const value = await callAsync<unknown>('scalar_async', input.query, input.params ?? []);
          return ok({ value });
        } catch (e) {
          return err('INTERNAL', e instanceof Error ? e.message : String(e));
        }
      },
    });

    register({
      name: 'oxmysql_execute',
      description:
        'Run a non-SELECT statement (INSERT/UPDATE/DELETE/DDL). Requires ' +
        'agent_api_plugin_oxmysql_readonly=false AND the statement verb to be in ' +
        'agent_api_plugin_oxmysql_allow_statements.',
      input: QueryInput,
      handler: async (input: QueryInput) => {
        const guard = guardQuery(input.query);
        if (!guard.ok) return err('COMMAND_NOT_ALLOWED', guard.reason);
        try {
          const result = await callAsync<unknown>('execute_async', input.query, input.params ?? []);
          return ok({ result });
        } catch (e) {
          return err('INTERNAL', e instanceof Error ? e.message : String(e));
        }
      },
    });
  },
};

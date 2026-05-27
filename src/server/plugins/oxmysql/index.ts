import { z } from 'zod';
import { oxmysql } from '@overextended/oxmysql';
import { err, ok } from '../../util/envelope';
import { Plugin } from '../types';
import { isResourceStarted } from '../helpers';

const RESOURCE = 'oxmysql';

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
  description: 'oxmysql bridge — gated SQL via @overextended/oxmysql. SELECT-only by default.',
  detect: () => isResourceStarted(RESOURCE),
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
          const rows = await oxmysql.query(input.query, input.params ?? []);
          const limit = input.rowLimit ?? 100;
          const arr = Array.isArray(rows) ? rows : rows == null ? [] : [rows];
          const trimmed = arr.slice(0, limit);
          return ok({
            rowCount: arr.length,
            truncated: arr.length > limit,
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
          const value = await oxmysql.scalar(input.query, input.params ?? []);
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
          const result = await oxmysql.rawExecute(input.query, input.params ?? []);
          return ok({ result });
        } catch (e) {
          return err('INTERNAL', e instanceof Error ? e.message : String(e));
        }
      },
    });

    register({
      name: 'oxmysql_schema',
      description:
        'Introspect the current database schema (read-only): tables with their columns ' +
        '(name, type, key, nullable, default). Pass `table` to scope to one table. Use before ' +
        'writing data-layer code so queries match the real schema.',
      input: z.object({ table: z.string().optional() }).strict(),
      handler: async (input: { table?: string }) => {
        try {
          const where = input.table ? 'AND TABLE_NAME = ?' : '';
          const params = input.table ? [input.table] : [];
          const rows = (await oxmysql.query(
            `SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, COLUMN_KEY, IS_NULLABLE, COLUMN_DEFAULT
             FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() ${where}
             ORDER BY TABLE_NAME, ORDINAL_POSITION`,
            params,
          )) as Array<Record<string, unknown>>;

          const tables: Record<string, unknown[]> = {};
          for (const r of rows) {
            const t = String(r.TABLE_NAME);
            (tables[t] ??= []).push({
              column: r.COLUMN_NAME,
              type: r.COLUMN_TYPE,
              key: r.COLUMN_KEY || null,
              nullable: r.IS_NULLABLE === 'YES',
              default: r.COLUMN_DEFAULT ?? null,
            });
          }
          return ok({ tableCount: Object.keys(tables).length, tables });
        } catch (e) {
          return err('INTERNAL', e instanceof Error ? e.message : String(e));
        }
      },
    });
  },
};

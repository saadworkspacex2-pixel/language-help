import { NextResponse } from 'next/server';
import { getTableColumns, getTableName, is, sql } from 'drizzle-orm';
import { PgTable } from 'drizzle-orm/pg-core';
import * as schema from '@/db/schema';
import { db } from '@/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/health — read-only deployment diagnostics.
 *
 * - Reports whether each env var is present (booleans only, never values).
 * - Connects to Postgres and surfaces the *real* driver error (it walks the
 *   `cause` chain that drizzle wraps around pg errors).
 * - Compares every table and column used by `src/db/schema.ts` against what
 *   actually exists in the database, so schema drift is impossible to miss.
 *
 * 200 = all good. 503 = something to fix, with `problems` + `hints`.
 * The expected schema is derived from the drizzle definitions, so this file
 * never needs updating when the schema grows.
 */

function errText(err: unknown): string {
  const parts: string[] = [];
  let current: unknown = err;
  for (let depth = 0; depth < 4 && current; depth += 1) {
    const message = current instanceof Error ? current.message : String(current);
    const clean = message.replace(/\s+/g, ' ').trim();
    if (clean && !parts.includes(clean)) parts.push(clean);
    current = current instanceof Error ? (current as Error & { cause?: unknown }).cause : null;
  }
  return parts.join(' -> ');
}

/** Intended shape of the database, taken from the drizzle schema. */
function expectedShape(): Record<string, string[]> {
  const shape: Record<string, string[]> = {};
  for (const value of Object.values(schema)) {
    if (!is(value, PgTable)) continue;
    const tableName = getTableName(value);
    shape[tableName] = Object.values(getTableColumns(value as PgTable))
      .map((column) => column.name)
      .sort();
  }
  return shape;
}

export async function GET() {
  const started = Date.now();

  const env = {
    DATABASE_URL: Boolean(process.env.DATABASE_URL),
    OTP_SECRET: Boolean(process.env.OTP_SECRET),
    OTP_DEV_MODE: process.env.OTP_DEV_MODE === '1',
    SMTP: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
    GOOGLE_OAUTH: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    NODE_ENV: process.env.NODE_ENV ?? null,
  };

  if (!env.DATABASE_URL) {
    return NextResponse.json(
      {
        ok: false,
        env,
        problems: ['DATABASE_URL is not set in this environment.'],
        hints: ['Add DATABASE_URL to your host environment variables, then redeploy.'],
      },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  // 1) Reachability
  let connection: Record<string, unknown>;
  try {
    const result = (await db.execute(
      sql`select current_database() as db, current_user as usr, version() as ver`,
    )) as unknown as { rows?: Record<string, unknown>[] } | Record<string, unknown>[];
    const row = (Array.isArray(result) ? result : (result.rows ?? []))[0] ?? {};
    connection = {
      ok: true,
      database: row.db,
      user: row.usr,
      server: String(row.ver ?? '').split(' ').slice(0, 2).join(' '),
    };
  } catch (err) {
    const message = errText(err);
    return NextResponse.json(
      {
        ok: false,
        env,
        connection: { ok: false, error: message },
        problems: [`Cannot reach the database: ${message}`],
        hints: [
          'Check host/port/user/password in DATABASE_URL.',
          'Hosted Postgres (Neon, Supabase, Railway) usually needs ?sslmode=require.',
          'If the provider gives several strings, use the direct (non-pooled) one for migrations.',
        ],
        latencyMs: Date.now() - started,
      },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  // 2) Schema drift: one query, then diff against the drizzle schema
  const expected = expectedShape();
  const present = new Map<string, Set<string>>();
  try {
    const result = (await db.execute(
      sql`select table_name, column_name from information_schema.columns where table_schema = 'public'`,
    )) as unknown as { rows?: Record<string, unknown>[] } | Record<string, unknown>[];
    const rows = Array.isArray(result) ? result : (result.rows ?? []);
    for (const row of rows) {
      const table = String(row.table_name);
      if (!present.has(table)) present.set(table, new Set());
      present.get(table)!.add(String(row.column_name));
    }
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        env,
        connection,
        problems: [`Could not read information_schema: ${errText(err)}`],
        hints: ['The database user may lack privileges on the public schema.'],
        latencyMs: Date.now() - started,
      },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const problems: string[] = [];
  const missingTables: string[] = [];
  const missingColumns: Record<string, string[]> = {};

  for (const [table, columns] of Object.entries(expected)) {
    const actual = present.get(table);
    if (!actual) {
      missingTables.push(table);
      problems.push(`Missing table: ${table}`);
      continue;
    }
    const absent = columns.filter((column) => !actual.has(column));
    if (absent.length > 0) {
      missingColumns[table] = absent;
      problems.push(`Missing column${absent.length > 1 ? 's' : ''}: ${absent.map((c) => `${table}.${c}`).join(', ')}`);
    }
  }

  const hints: string[] = [];
  if (problems.length > 0) {
    hints.push('Sync the database with the app schema: run `npx drizzle-kit push` using this exact DATABASE_URL (answer yes to any prompt).');
    hints.push('Optionally load demo content afterwards: `npx tsx src/db/seed.ts`.');
    hints.push('Until this is fixed, any page that queries these tables will show a server error.');
  }
  if (!env.OTP_SECRET) hints.push('OTP_SECRET is not set — email-code sign-in cannot work. Use `openssl rand -hex 32`.');
  if (!env.SMTP) hints.push('SMTP_* is not configured — email OTP codes cannot be delivered (OTP_DEV_MODE=1 shows them on screen, staging only).');
  if (!env.GOOGLE_OAUTH) hints.push('GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not set — the "Continue with Google" button is hidden.');
  if (env.OTP_DEV_MODE) hints.push('OTP_DEV_MODE=1 — turn this off in production.');

  return NextResponse.json(
    {
      ok: problems.length === 0,
      env,
      connection,
      schema: {
        tablesExpected: Object.keys(expected).length,
        tablesMissing: missingTables,
        columnsMissing: missingColumns,
      },
      problems,
      hints,
      latencyMs: Date.now() - started,
    },
    { status: problems.length === 0 ? 200 : 503, headers: { 'Cache-Control': 'no-store' } },
  );
}

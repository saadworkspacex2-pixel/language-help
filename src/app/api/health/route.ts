import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { db } from '@/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/health
 * Read-only deployment diagnostics. Never exposes secret values — only whether
 * each variable is present. Returns 200 when the database is reachable and the
 * schema is complete, 503 otherwise, with a `problems` list you can act on.
 */

const REQUIRED_TABLES = [
  'users', 'otp_codes', 'courses', 'batches', 'schedules', 'enrollments',
  'enrollment_requests', 'class_sessions', 'attendance', 'homework',
  'homework_assignees', 'homework_submissions', 'payments', 'certificates',
  'notices', 'gallery', 'branches', 'contact_messages', 'settings', 'messages',
  'books', 'book_variants', 'book_orders', 'auth_sessions',
];

const REQUIRED_COLUMNS: Record<string, string[]> = {
  users: ['google_id', 'is_founder', 'show_on_site', 'password_hash', 'student_id'],
  courses: ['active'],
  otp_codes: ['code_hash', 'expires_at', 'attempts', 'consumed_at'],
};

type Check = { ok: boolean; value?: unknown; error?: string };

/** Drizzle wraps driver errors, so walk the `cause` chain to surface the real reason. */
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

async function firstRow(query: ReturnType<typeof sql>): Promise<Record<string, unknown>> {
  const res = (await db.execute(query)) as unknown as { rows?: Record<string, unknown>[] } | Record<string, unknown>[];
  const rows = Array.isArray(res) ? res : (res.rows ?? []);
  return rows[0] ?? {};
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

  const problems: string[] = [];
  const hints: string[] = [];

  if (!env.DATABASE_URL) {
    return NextResponse.json(
      {
        ok: false,
        env,
        problems: ['DATABASE_URL is not set in this environment.'],
        hints: [
          'Add DATABASE_URL to your host environment variables, then redeploy.',
          'Every page that touches the database will show a generic server error without it.',
        ],
      },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  // 1) Can we reach the database at all?
  let connection: Check;
  try {
    const row = await firstRow(sql`select current_database() as db, current_user as usr, version() as ver`);
    connection = {
      ok: true,
      value: {
        database: row.db,
        user: row.usr,
        server: String(row.ver ?? '').split(' ').slice(0, 2).join(' '),
      },
    };
  } catch (err) {
    const message = errText(err);
    connection = { ok: false, error: message };
    problems.push(`Cannot reach the database: ${message}`);
    hints.push(
      'Check the host/port/credentials in DATABASE_URL, and add ?sslmode=require for hosted Postgres (Neon, Supabase, Railway).',
      'If the database uses connection pooling, use the pooled connection string.',
    );
    return NextResponse.json(
      { ok: false, env, connection, problems, hints, latencyMs: Date.now() - started },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  // 2) Do the tables the app queries exist?
  const tables: Record<string, boolean | string> = {};
  for (const table of REQUIRED_TABLES) {
    try {
      const row = await firstRow(sql`select to_regclass(${'public.' + table}) is not null as present`);
      const present = row.present === true;
      tables[table] = present;
      if (!present) problems.push(`Missing table: ${table}`);
    } catch (err) {
      tables[table] = `error: ${errText(err)}`;
    }
  }

  // 3) Do the newer columns exist (schema drift from an old push)?
  const columns: Record<string, Record<string, boolean>> = {};
  for (const [table, cols] of Object.entries(REQUIRED_COLUMNS)) {
    columns[table] = {};
    for (const col of cols) {
      try {
        const row = await firstRow(sql`
          select count(*)::int as n
          from information_schema.columns
          where table_schema = 'public' and table_name = ${table} and column_name = ${col}
        `);
        const present = Number(row.n ?? 0) > 0;
        columns[table][col] = present;
        if (!present) problems.push(`Missing column: ${table}.${col}`);
      } catch (err) {
        problems.push(`Could not inspect ${table}.${col}: ${errText(err)}`);
      }
    }
  }

  if (problems.length > 0) {
    hints.push('Run the schema sync against this database: `npx drizzle-kit push` with the same DATABASE_URL.');
    hints.push('Optional demo content afterwards: `npx tsx src/db/seed.ts`.');
  }
  if (!env.SMTP) hints.push('SMTP_* is not configured — email OTP codes cannot be delivered (set OTP_DEV_MODE=1 on staging to show them on screen).');
  if (!env.GOOGLE_OAUTH) hints.push('GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not set — the "Continue with Google" button is hidden.');
  if (env.OTP_DEV_MODE) hints.push('OTP_DEV_MODE=1 — turn this off in production.');

  return NextResponse.json(
    {
      ok: problems.length === 0,
      env,
      connection,
      tables,
      columns,
      problems,
      hints,
      latencyMs: Date.now() - started,
    },
    { status: problems.length === 0 ? 200 : 503, headers: { 'Cache-Control': 'no-store' } },
  );
}

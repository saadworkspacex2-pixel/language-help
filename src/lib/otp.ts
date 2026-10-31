import { createHash, randomInt, timingSafeEqual } from 'crypto';
import { db } from '@/db';
import { otpCodes } from '@/db/schema';
import { and, desc, eq, gt, isNull, sql } from 'drizzle-orm';

const TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const RESEND_SECONDS = 45;

/** OTP_SECRET keeps stored hashes useless if the database leaks. */
function secret() {
  return process.env.OTP_SECRET || process.env.SMTP_PASS || 'lhbd-dev-otp-secret';
}

export function generateCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

export function hashCode(email: string, code: string): string {
  return createHash('sha256').update(`${email.toLowerCase()}:${code}:${secret()}`).digest('hex');
}

export type OtpRequestResult =
  | { ok: true; code: string; devMode: boolean; expiresInMinutes: number }
  | { ok: false; error: string; retryAfter?: number };

/**
 * Create + persist a fresh login code for an email address.
 * Returns the plaintext code so the caller can mail it (never stored as-is).
 */
export async function issueOtp(email: string): Promise<OtpRequestResult> {
  const normalised = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalised)) return { ok: false, error: 'Enter a valid email address.' };

  // simple throttle: one code per RESEND_SECONDS per address
  const [recent] = await db
    .select({ createdAt: otpCodes.createdAt })
    .from(otpCodes)
    .where(eq(otpCodes.email, normalised))
    .orderBy(desc(otpCodes.id))
    .limit(1);

  if (recent) {
    const elapsed = (Date.now() - new Date(recent.createdAt).getTime()) / 1000;
    if (elapsed < RESEND_SECONDS) {
      return { ok: false, error: 'A code was just sent — please wait a moment.', retryAfter: Math.ceil(RESEND_SECONDS - elapsed) };
    }
  }

  // invalidate older live codes
  await db
    .update(otpCodes)
    .set({ consumedAt: new Date() })
    .where(and(eq(otpCodes.email, normalised), isNull(otpCodes.consumedAt)));

  const code = generateCode();
  await db.insert(otpCodes).values({
    email: normalised,
    codeHash: hashCode(normalised, code),
    expiresAt: new Date(Date.now() + TTL_MINUTES * 60 * 1000),
  });

  return {
    ok: true,
    code,
    devMode: process.env.OTP_DEV_MODE === '1',
    expiresInMinutes: TTL_MINUTES,
  };
}

export type OtpVerifyResult = { ok: true; email: string } | { ok: false; error: string };

export async function verifyOtp(email: string, code: string): Promise<OtpVerifyResult> {
  const normalised = email.trim().toLowerCase();
  const clean = code.replace(/\s/g, '');
  if (!/^\d{6}$/.test(clean)) return { ok: false, error: 'Enter the 6-digit code from your email.' };

  const [row] = await db
    .select()
    .from(otpCodes)
    .where(and(eq(otpCodes.email, normalised), isNull(otpCodes.consumedAt), gt(otpCodes.expiresAt, new Date())))
    .orderBy(desc(otpCodes.id))
    .limit(1);

  if (!row) return { ok: false, error: 'That code has expired — request a new one.' };
  if (row.attempts >= MAX_ATTEMPTS) return { ok: false, error: 'Too many attempts. Request a new code.' };

  const expected = Buffer.from(row.codeHash, 'hex');
  const given = Buffer.from(hashCode(normalised, clean), 'hex');
  const match = expected.length === given.length && timingSafeEqual(expected, given);

  if (!match) {
    await db.update(otpCodes).set({ attempts: sql`${otpCodes.attempts} + 1` }).where(eq(otpCodes.id, row.id));
    return { ok: false, error: 'That code is not correct. Try again.' };
  }

  await db.update(otpCodes).set({ consumedAt: new Date() }).where(eq(otpCodes.id, row.id));
  return { ok: true, email: normalised };
}

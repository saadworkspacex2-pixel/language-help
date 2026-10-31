'use server';

import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyPassword, hashPassword } from '@/lib/password';
import { createSession, destroySession, dashboardPath } from '@/lib/session';
import { redirect } from 'next/navigation';
import { genStudentId } from '@/lib/utils';
import { issueOtp, verifyOtp } from '@/lib/otp';
import { mailConfigured, sendOtpEmail } from '@/lib/mailer';
import { findOrCreateUser } from '@/lib/auth-users';

export async function loginAction(formData: FormData) {
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');
  const role = String(formData.get('role') || 'student');

  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const user = rows[0];
  if (!user || !verifyPassword(password, user.passwordHash)) {
    redirect(`/login?error=invalid&role=${role}`);
  }
  if (user.role !== role) {
    redirect(`/login?error=role&role=${role}`);
  }
  await createSession(user.id);
  redirect(dashboardPath(user.role));
}

export async function registerAction(formData: FormData) {
  const name = String(formData.get('name') || '').trim();
  const phone = String(formData.get('phone') || '').trim();
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');

  if (!name || !email || !password) redirect('/register?error=missing');

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing.length) redirect('/register?error=email');

  // Generate a unique student ID
  let studentId = genStudentId();
  for (let i = 0; i < 10; i++) {
    const clash = await db.select({ id: users.id }).from(users).where(eq(users.studentId, studentId)).limit(1);
    if (!clash.length) break;
    studentId = genStudentId();
  }

  const inserted = await db
    .insert(users)
    .values({ role: 'student', name, email, phone, passwordHash: hashPassword(password), studentId, showOnSite: false })
    .returning({ id: users.id });

  await createSession(inserted[0].id);
  redirect('/portal?setup=1');
}

export async function logoutAction() {
  await destroySession();
  redirect('/');
}

/* ============================================================================
   Email one-time code (OTP) sign-in — delivered with nodemailer
   ========================================================================== */

export type OtpState = { ok: boolean; message?: string; devCode?: string; email?: string };

export async function requestOtpAction(formData: FormData): Promise<OtpState> {
  const email = String(formData.get('email') || '').trim().toLowerCase();
  if (!email) return { ok: false, message: 'Enter your email address.' };

  const issued = await issueOtp(email);
  if (!issued.ok) return { ok: false, message: issued.error };

  // Only mail known addresses? No — sign-in also provisions a new student
  // account, so mail any valid address (same as “sign in or sign up”).
  const [account] = await db.select({ name: users.name }).from(users).where(eq(users.email, email)).limit(1);

  if (!mailConfigured()) {
    // Nothing to send with — surface the code only if explicitly allowed (dev/staging).
    if (issued.devMode) {
      return { ok: true, email, devCode: issued.code, message: 'Email is not configured, so the code is shown here (OTP_DEV_MODE=1).' };
    }
    return { ok: false, message: 'Email delivery is not configured on this server. Please use your password, or contact the office.' };
  }

  try {
    await sendOtpEmail(email, issued.code, account?.name);
    return { ok: true, email, message: `We emailed a 6-digit code to ${email}. It expires in ${issued.expiresInMinutes} minutes.` };
  } catch (e) {
    console.error('[otp] send failed', e);
    return { ok: false, message: 'We could not send the email just now. Please try again in a minute.' };
  }
}

export async function verifyOtpAction(formData: FormData): Promise<OtpState & { redirectTo?: string }> {
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const code = String(formData.get('code') || '');

  const result = await verifyOtp(email, code);
  if (!result.ok) return { ok: false, message: result.error, email };

  const user = await findOrCreateUser({ email: result.email });
  await createSession(user.id);
  return { ok: true, redirectTo: dashboardPath(user.role), message: 'Signed in.' };
}

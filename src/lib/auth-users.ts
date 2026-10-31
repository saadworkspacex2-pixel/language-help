import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { genStudentId } from '@/lib/utils';
import { randomBytes } from 'crypto';

/** Passwordless accounts get a hash that can never match verifyPassword(). */
export const UNUSABLE_PASSWORD = '!passwordless';

async function uniqueStudentId(): Promise<string> {
  let studentId = genStudentId();
  for (let i = 0; i < 10; i++) {
    const clash = await db.select({ id: users.id }).from(users).where(eq(users.studentId, studentId)).limit(1);
    if (!clash.length) return studentId;
    studentId = genStudentId();
  }
  return `LHBD-${Date.now()}`;
}

export type ProviderProfile = { email: string; name?: string | null; googleId?: string | null };

/**
 * Find the account for a verified provider identity, creating a student account
 * on first sign-in. Existing (password) accounts are linked, not duplicated.
 */
export async function findOrCreateUser(profile: ProviderProfile) {
  const email = profile.email.trim().toLowerCase();

  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing) {
    // link the Google subject to the existing account on first Google sign-in
    if (profile.googleId && !existing.googleId) {
      await db.update(users).set({ googleId: profile.googleId }).where(eq(users.id, existing.id));
      return { ...existing, googleId: profile.googleId };
    }
    return existing;
  }

  const [created] = await db
    .insert(users)
    .values({
      role: 'student',
      name: profile.name?.trim() || email.split('@')[0],
      email,
      passwordHash: UNUSABLE_PASSWORD + ':' + randomBytes(8).toString('hex'),
      googleId: profile.googleId ?? null,
      studentId: await uniqueStudentId(),
      showOnSite: false,
    })
    .returning();

  return created;
}

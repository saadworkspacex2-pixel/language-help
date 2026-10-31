import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';
import { db } from '@/db';
import { authSessions, users, User } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

const COOKIE = 'lhbd_session';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export async function createSession(userId: number) {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + MAX_AGE * 1000);
  await db.insert(authSessions).values({ token, userId, expiresAt });
  const c = await cookies();
  c.set(COOKIE, token, { httpOnly: true, maxAge: MAX_AGE, path: '/', sameSite: 'lax' });
}

export async function destroySession() {
  const c = await cookies();
  const token = c.get(COOKIE)?.value;
  if (token) await db.delete(authSessions).where(eq(authSessions.token, token));
  c.delete(COOKIE);
}

export async function getSessionUser(): Promise<User | null> {
  const c = await cookies();
  const token = c.get(COOKIE)?.value;
  if (!token) return null;
  const rows = await db
    .select({ user: users })
    .from(authSessions)
    .innerJoin(users, eq(authSessions.userId, users.id))
    .where(eq(authSessions.token, token))
    .limit(1);
  if (!rows.length) return null;
  return rows[0].user;
}

export async function requireRole(...roles: string[]): Promise<User> {
  const user = await getSessionUser();
  if (!user || !roles.includes(user.role)) redirect('/login');
  return user;
}

export function dashboardPath(role: string): string {
  if (role === 'management') return '/admin';
  if (role === 'teacher') return '/teacher';
  return '/portal';
}

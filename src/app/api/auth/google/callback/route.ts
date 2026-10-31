import { NextRequest, NextResponse } from 'next/server';
import { exchangeCode, fetchProfile, googleConfigured, requestOrigin, GOOGLE_STATE_COOKIE } from '@/lib/google';
import { findOrCreateUser } from '@/lib/auth-users';
import { createSession, dashboardPath } from '@/lib/session';

export const dynamic = 'force-dynamic';

function fail(origin: string, reason: string) {
  const url = new URL('/login', origin);
  url.searchParams.set('error', reason);
  const res = NextResponse.redirect(url);
  res.cookies.delete(GOOGLE_STATE_COOKIE);
  return res;
}

export async function GET(req: NextRequest) {
  const origin = requestOrigin(req);
  if (!googleConfigured()) return fail(origin, 'google_off');

  const code = req.nextUrl.searchParams.get('code');
  const state = req.nextUrl.searchParams.get('state');
  const cookie = req.cookies.get(GOOGLE_STATE_COOKIE)?.value;

  if (req.nextUrl.searchParams.get('error')) return fail(origin, 'google_cancelled');

  // CSRF: the state must match the one we issued
  const [cookieState, next] = (cookie || '').split('|');
  if (!code || !state || !cookieState || state !== cookieState) return fail(origin, 'google_state');

  try {
    const tokens = await exchangeCode(origin, code);
    if (!tokens.access_token) return fail(origin, 'google_token');

    const profile = await fetchProfile(tokens.access_token);
    if (!profile?.email) return fail(origin, 'google_profile');
    if (profile.email_verified === false) return fail(origin, 'google_unverified');

    const user = await findOrCreateUser({
      email: profile.email,
      name: profile.name,
      googleId: profile.sub,
    });

    await createSession(user.id);

    const res = NextResponse.redirect(new URL(next && next.startsWith('/') ? next : dashboardPath(user.role), origin));
    res.cookies.delete(GOOGLE_STATE_COOKIE);
    return res;
  } catch (e) {
    console.error('[google-oauth]', e);
    return fail(origin, 'google_failed');
  }
}

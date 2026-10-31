import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { authUrl, googleConfigured, requestOrigin, GOOGLE_STATE_COOKIE } from '@/lib/google';

export const dynamic = 'force-dynamic';

/** Kick off the Google OAuth dance. */
export async function GET(req: NextRequest) {
  const origin = requestOrigin(req);
  if (!googleConfigured()) {
    return NextResponse.redirect(new URL('/login?error=google_off', origin));
  }

  const state = randomBytes(16).toString('hex');
  const next = req.nextUrl.searchParams.get('next') || '';
  const res = NextResponse.redirect(authUrl(origin, state));

  res.cookies.set(GOOGLE_STATE_COOKIE, `${state}${next ? '|' + next.slice(0, 120) : ''}`, {
    httpOnly: true,
    sameSite: 'lax',
    secure: origin.startsWith('https://'),
    path: '/',
    maxAge: 600,
  });

  return res;
}

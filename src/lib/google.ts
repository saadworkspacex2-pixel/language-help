/**
 * Google OAuth 2.0 (OpenID Connect) helpers — no extra dependency, just fetch.
 *
 * Configure:
 *   GOOGLE_CLIENT_ID
 *   GOOGLE_CLIENT_SECRET
 *   GOOGLE_REDIRECT_URI   optional; defaults to <origin>/api/auth/google/callback
 *
 * In Google Cloud Console → APIs & Services → Credentials → OAuth client (Web):
 *   Authorised redirect URI: https://your-domain.com/api/auth/google/callback
 */

export const GOOGLE_STATE_COOKIE = 'lhbd_oauth_state';

/**
 * Public origin of the request. Hosting proxies (Vercel, the E2B preview,
 * nginx) terminate TLS and forward the real host, so prefer those headers.
 */
export function requestOrigin(req: { headers: Headers; nextUrl: URL }): string {
  const proto = req.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() || req.nextUrl.protocol.replace(':', '');
  const host =
    req.headers.get('x-forwarded-host')?.split(',')[0]?.trim() ||
    req.headers.get('host') ||
    req.nextUrl.host;
  return `${proto}://${host}`;
}

export function googleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function redirectUri(origin: string): string {
  return process.env.GOOGLE_REDIRECT_URI || `${origin}/api/auth/google/callback`;
}

export function authUrl(origin: string, state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID as string,
    redirect_uri: redirectUri(origin),
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'online',
    prompt: 'select_account',
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

type GoogleTokens = { access_token?: string; id_token?: string; error?: string; error_description?: string };

export async function exchangeCode(origin: string, code: string): Promise<GoogleTokens> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID as string,
      client_secret: process.env.GOOGLE_CLIENT_SECRET as string,
      redirect_uri: redirectUri(origin),
      grant_type: 'authorization_code',
    }),
    cache: 'no-store',
  });
  return (await res.json()) as GoogleTokens;
}

export type GoogleProfile = {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
};

export async function fetchProfile(accessToken: string): Promise<GoogleProfile | null> {
  const res = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  return (await res.json()) as GoogleProfile;
}

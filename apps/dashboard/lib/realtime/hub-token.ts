import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Short-lived token the dashboard hands to a browser so it can open the SSE
 * stream on the realtime hub (the Railway worker). Signed with a secret shared
 * by Vercel and the worker; the hub never talks to the database.
 */
const TOKEN_TTL_MS = 5 * 60_000;

type HubTokenPayload = {
  org: string;
  exp: number;
  /** Present for presence heartbeats; the hub never reads the database. */
  uid?: string;
  name?: string;
};

function hubSecret(): string | null {
  const secret =
    process.env.REALTIME_HUB_SECRET?.trim() || process.env.AUTH_SECRET?.trim();
  return secret || null;
}

function sign(body: string, secret: string): string {
  return createHmac('sha256', secret).update(body).digest('base64url');
}

export function signHubToken(
  organizationId: string,
  user?: { id: string; name?: string | null }
): { token: string; expiresAt: number } | null {
  const secret = hubSecret();
  if (!secret) return null;
  const payload: HubTokenPayload = {
    org: organizationId,
    exp: Date.now() + TOKEN_TTL_MS,
    ...(user ? { uid: user.id, name: (user.name ?? '').slice(0, 80) } : {})
  };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return { token: `${body}.${sign(body, secret)}`, expiresAt: payload.exp };
}

export function verifyHubToken(
  token: string
): { org: string; userId?: string; userName?: string } | null {
  const secret = hubSecret();
  if (!secret) return null;
  const [body, signature] = token.split('.');
  if (!body || !signature) return null;

  const expected = Buffer.from(sign(body, secret));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(body, 'base64url').toString('utf8')
    ) as HubTokenPayload;
    if (!payload.org || payload.exp < Date.now()) return null;
    return { org: payload.org, userId: payload.uid, userName: payload.name };
  } catch {
    return null;
  }
}

/** Bearer check for server-to-hub publishes. */
export function isHubPublishAuthorized(header: string | undefined): boolean {
  const secret = hubSecret();
  if (!secret || !header?.startsWith('Bearer ')) return false;
  const given = Buffer.from(header.slice(7));
  const want = Buffer.from(secret);
  return given.length === want.length && timingSafeEqual(given, want);
}

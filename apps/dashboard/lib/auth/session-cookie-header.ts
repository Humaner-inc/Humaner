export const SESSION_COOKIE_CHUNK_INDEXES = [0, 1, 2, 3, 4] as const;

const OPAQUE_SESSION_TOKEN_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isOpaqueSessionToken(value: string): boolean {
  return OPAQUE_SESSION_TOKEN_RE.test(value);
}

export function isSessionCookieChunkName(
  cookieName: string,
  sessionCookieName: string
): boolean {
  if (!cookieName.startsWith(`${sessionCookieName}.`)) {
    return false;
  }
  return /^\d+$/.test(cookieName.slice(sessionCookieName.length + 1));
}

export function sessionCookieChunkNames(sessionCookieName: string): string[] {
  return SESSION_COOKIE_CHUNK_INDEXES.map(
    (index) => `${sessionCookieName}.${index}`
  );
}

export type SanitizedSessionCookieHeader = {
  cookieHeader: string | null;
  sessionToken: string | null;
  droppedChunkNames: string[];
};

/**
 * Drop JWT chunk leftovers and, when the same session name appears twice
 * (host-only JWT + parent-domain UUID), keep the opaque database token.
 */
export function sanitizeSessionCookieHeader(
  cookieHeader: string | null | undefined,
  sessionCookieName: string
): SanitizedSessionCookieHeader {
  if (!cookieHeader?.trim()) {
    return {
      cookieHeader: cookieHeader ?? null,
      sessionToken: null,
      droppedChunkNames: []
    };
  }

  const droppedChunkNames: string[] = [];
  const sessionValues: string[] = [];
  const kept: string[] = [];

  for (const part of cookieHeader.split(';')) {
    const trimmed = part.trim();
    if (!trimmed) {
      continue;
    }
    const eq = trimmed.indexOf('=');
    if (eq <= 0) {
      continue;
    }
    const name = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1);

    if (isSessionCookieChunkName(name, sessionCookieName)) {
      droppedChunkNames.push(name);
      continue;
    }

    if (name === sessionCookieName) {
      sessionValues.push(value);
      continue;
    }

    kept.push(trimmed);
  }

  let sessionToken: string | null = null;
  if (sessionValues.length > 0) {
    sessionToken =
      sessionValues.find(isOpaqueSessionToken) ??
      sessionValues[sessionValues.length - 1] ??
      null;
    if (sessionToken) {
      kept.push(`${sessionCookieName}=${sessionToken}`);
    }
  }

  return {
    cookieHeader: kept.length > 0 ? kept.join('; ') : null,
    sessionToken,
    droppedChunkNames: [...new Set(droppedChunkNames)]
  };
}

export function expireCookieSetCookie(
  name: string,
  options: { secure: boolean; domain?: string }
): string {
  const parts = [
    `${name}=`,
    'Path=/',
    'Max-Age=0',
    'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
    'HttpOnly',
    'SameSite=Lax'
  ];
  if (options.secure) {
    parts.push('Secure');
  }
  if (options.domain) {
    parts.push(`Domain=${options.domain}`);
  }
  return parts.join('; ');
}

/** Host-only + parent-domain expires for leftover JWT chunks. */
export function expireSessionChunkSetCookies(
  sessionCookieName: string,
  options: { secure: boolean; domain?: string }
): string[] {
  const headers: string[] = [];
  for (const name of sessionCookieChunkNames(sessionCookieName)) {
    headers.push(expireCookieSetCookie(name, { secure: options.secure }));
    if (options.domain) {
      headers.push(
        expireCookieSetCookie(name, {
          secure: options.secure,
          domain: options.domain
        })
      );
    }
  }
  return headers;
}

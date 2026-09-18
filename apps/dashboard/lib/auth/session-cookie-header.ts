export const SESSION_COOKIE_CHUNK_INDEXES = [0, 1, 2, 3, 4] as const;

/** Auth.js names we may see — production uses the `__Secure-` prefix. */
export const SESSION_COOKIE_BASE_NAMES = [
  '__Secure-authjs.session-token',
  'authjs.session-token'
] as const;

const OPAQUE_SESSION_TOKEN_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isOpaqueSessionToken(value: string): boolean {
  return OPAQUE_SESSION_TOKEN_RE.test(value);
}

function toSessionCookieNames(
  sessionCookieName: string | readonly string[]
): string[] {
  return typeof sessionCookieName === 'string'
    ? [sessionCookieName]
    : [...sessionCookieName];
}

export function isSessionCookieChunkName(
  cookieName: string,
  sessionCookieName: string | readonly string[]
): boolean {
  for (const base of toSessionCookieNames(sessionCookieName)) {
    if (!cookieName.startsWith(`${base}.`)) {
      continue;
    }
    if (/^\d+$/.test(cookieName.slice(base.length + 1))) {
      return true;
    }
  }
  return false;
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
  /**
   * True when the same session cookie name arrived more than once — the
   * signature of a stale parent-domain (`.humaner.io`) copy shadowing the
   * fresh host-only token. Callers expire the parent-domain copy so the
   * next request only carries the valid host-only session.
   */
  hadDuplicateSessionValues: boolean;
};

function lastOpaqueToken(values: string[]): string | null {
  let lastOpaque: string | null = null;
  for (const value of values) {
    if (isOpaqueSessionToken(value)) {
      lastOpaque = value;
    }
  }
  return lastOpaque;
}

/**
 * Drop JWT chunk leftovers and, when the same session name appears twice
 * (host-only JWT + parent-domain UUID), keep the opaque database token.
 */
export function sanitizeSessionCookieHeader(
  cookieHeader: string | null | undefined,
  sessionCookieName: string | readonly string[]
): SanitizedSessionCookieHeader {
  const sessionNames = toSessionCookieNames(sessionCookieName);
  const sessionNameSet = new Set(sessionNames);

  if (!cookieHeader?.trim()) {
    return {
      cookieHeader: cookieHeader ?? null,
      sessionToken: null,
      droppedChunkNames: [],
      hadDuplicateSessionValues: false
    };
  }

  const droppedChunkNames: string[] = [];
  const sessionValuesByName = new Map<string, string[]>();
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

    if (isSessionCookieChunkName(name, sessionNames)) {
      droppedChunkNames.push(name);
      continue;
    }

    if (sessionNameSet.has(name)) {
      const values = sessionValuesByName.get(name) ?? [];
      values.push(value);
      sessionValuesByName.set(name, values);
      continue;
    }

    kept.push(trimmed);
  }

  let sessionToken: string | null = null;
  let hadDuplicateSessionValues = false;

  for (const name of sessionNames) {
    const values = sessionValuesByName.get(name);
    if (!values?.length) {
      continue;
    }
    if (values.length > 1) {
      hadDuplicateSessionValues = true;
    }
    const chosen = lastOpaqueToken(values) ?? values[values.length - 1] ?? null;
    if (chosen && isOpaqueSessionToken(chosen)) {
      kept.push(`${name}=${chosen}`);
      if (!sessionToken) {
        sessionToken = chosen;
      }
    }
  }

  return {
    cookieHeader: kept.length > 0 ? kept.join('; ') : null,
    sessionToken,
    droppedChunkNames: [...new Set(droppedChunkNames)],
    hadDuplicateSessionValues
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

/**
 * Expire the stale parent-domain (`.humaner.io`) copy of the *base* session
 * cookie. The app writes the session token host-only, so a `Domain=…` copy of
 * the base name can only be a leftover from an earlier deploy that shadows the
 * fresh host-only token. Host-only cookies are unaffected by a `Domain=` expiry,
 * so this only removes the stale copy.
 */
export function expireParentDomainSessionSetCookie(
  sessionCookieName: string,
  options: { secure: boolean; domain: string }
): string {
  return expireCookieSetCookie(sessionCookieName, {
    secure: options.secure,
    domain: options.domain
  });
}

/** Expire leftover Domain=.humaner.io session cookies for every known name. */
export function expireParentDomainSessionSetCookies(options: {
  secure: boolean;
  domain: string;
}): string[] {
  return SESSION_COOKIE_BASE_NAMES.map((name) =>
    expireParentDomainSessionSetCookie(name, options)
  );
}

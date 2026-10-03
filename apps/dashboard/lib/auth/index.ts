import { cache } from 'react';
import { cookies } from 'next/headers';
import NextAuth, { type DefaultSession, type NextAuthConfig } from 'next-auth';

import { Routes } from '@/constants/routes';
import { adapter } from '@/lib/auth/adapter';
import { callbacks } from '@/lib/auth/callbacks';
import { AuthCookies } from '@/lib/auth/cookies';
import { events } from '@/lib/auth/events';
import { encodeDatabaseSessionToken } from '@/lib/auth/jwt-session';
import { providers } from '@/lib/auth/providers';
import { session } from '@/lib/auth/session';

declare module 'next-auth' {
  interface User {
    organizationId: string | null;
  }

  interface Session {
    user: {
      organizationId: string | null;
    } & DefaultSession['user'];
  }
}

declare module '@auth/core/adapters' {
  interface AdapterUser {
    organizationId: string | null;
  }
}

declare module '@auth/core/types' {
  interface User {
    organizationId: string | null;
  }
}

export const authConfig = {
  adapter,
  providers,
  secret: process.env.AUTH_SECRET,
  session,
  pages: {
    signIn: Routes.Login,
    signOut: Routes.Logout,
    error: Routes.AuthError, // Error code passed in query string as ?error=ERROR_CODE
    newUser: Routes.Onboarding
  },
  cookies: {
    sessionToken: {
      name: AuthCookies.SessionToken,
      // Parent-domain (`.humaner.io`) session cookie — the scheme that worked
      // at 1.0. Every write path uses the same scope so a fresh login always
      // overwrites the previous cookie instead of leaving a shadow copy.
      options: AuthCookies.sessionCookieOptions()
    }
  },
  callbacks,
  events,
  // Surface the real cause of OAuth failures. Auth.js otherwise collapses
  // callback/adapter exceptions into a generic `?error=Configuration`, which
  // the UI renders as "Unknown error" with no server-side trace.
  logger: {
    error(error: Error) {
      // Next's dev overlay treats console.error during render as a lint.
      // A dropped database connection is already handled by dedupedAuth.
      if (isTransientAuthDbError(error)) {
        console.warn('[auth] database unreachable during session lookup');
        return;
      }
      console.error('[auth] error', {
        name: error?.name,
        message: error?.message,
        cause: (error as { cause?: unknown })?.cause,
        stack: error?.stack
      });
    },
    warn(code: string) {
      console.warn('[auth] warn', code);
    },
    debug() {
      // Auth.js calls this in development; keep production logs to error/warn.
    }
  },
  jwt: {
    maxAge: session.maxAge,
    // Opaque DB session token only — see encodeDatabaseSessionToken.
    encode: encodeDatabaseSessionToken
  },
  trustHost: true
} satisfies NextAuthConfig;

// All those actions need to be called server-side
export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);

function isAuthSessionLookupError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const name = (error as { name?: string }).name;
  // Auth.js wraps a failed `session.findUnique()` as both of these. A Neon
  // blip (P1001 / P1017) otherwise crashes the dashboard shell instead of
  // signing out.
  return name === 'AdapterError' || name === 'SessionTokenError';
}

const TRANSIENT_DB_CODES = new Set(['P1001', 'P1008', 'P1017', 'P2024']);

function readErrorCode(error: unknown, depth = 0): string | null {
  if (!error || typeof error !== 'object' || depth > 4) return null;
  const record = error as { code?: unknown; cause?: unknown; err?: unknown };
  if (typeof record.code === 'string') return record.code;
  return (
    readErrorCode(record.err, depth + 1) ??
    readErrorCode(record.cause, depth + 1)
  );
}

/** Neon asleep or a pooled connection closed. Not an application bug. */
function isTransientAuthDbError(error: unknown): boolean {
  const code = readErrorCode(error);
  return code !== null && TRANSIENT_DB_CODES.has(code);
}

// Deduplicated per-request session. Await cookies first so Cache Components
// postpones before Auth.js calls `crypto.getRandomValues()` (CSRF / session).
// Do not use `connection()` here — it blocks instant client navigations.
export const dedupedAuth = cache(async () => {
  await cookies();
  try {
    return await auth();
  } catch (error) {
    if (!isAuthSessionLookupError(error)) {
      throw error;
    }
    if (isTransientAuthDbError(error)) {
      try {
        return await auth();
      } catch (retryError) {
        if (!isAuthSessionLookupError(retryError)) {
          throw retryError;
        }
        console.warn(
          '[auth] database unreachable; session treated as signed out'
        );
        return null;
      }
    }
    console.error('[auth] session lookup failed', error);
    return null;
  }
});

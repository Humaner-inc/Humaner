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
    newUser: Routes.OnboardingConnectGmail
  },
  cookies: {
    sessionToken: {
      name: AuthCookies.SessionToken,
      options: AuthCookies.hostOnlyCookieOptions()
    }
  },
  callbacks,
  events,
  jwt: {
    maxAge: session.maxAge,
    // Opaque DB session token only — see encodeDatabaseSessionToken.
    encode: encodeDatabaseSessionToken
  },
  trustHost: true
} satisfies NextAuthConfig;

// All those actions need to be called server-side
export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);

// Deduplicated per-request session. Await cookies first so Cache Components
// postpones before Auth.js calls `crypto.getRandomValues()` (CSRF / session).
// Do not use `connection()` here — it blocks instant client navigations.
export const dedupedAuth = cache(async () => {
  await cookies();
  return auth();
});

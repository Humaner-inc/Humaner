import { cache } from 'react';
import NextAuth, { type DefaultSession, type NextAuthConfig } from 'next-auth';
import { encode } from 'next-auth/jwt';

import { Routes } from '@/constants/routes';
import { adapter } from '@/lib/auth/adapter';
import { callbacks } from '@/lib/auth/callbacks';
import { events } from '@/lib/auth/events';
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
  callbacks,
  events,
  jwt: {
    maxAge: session.maxAge,
    // Required line to encode credentials sessions
    async encode(arg) {
      return (arg.token?.sessionId as string) ?? encode(arg);
    }
  },
  trustHost: true
} satisfies NextAuthConfig;

// All those actions need to be called server-side
export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);

// Deduplicated server-side auth call
export const dedupedAuth = cache(auth);

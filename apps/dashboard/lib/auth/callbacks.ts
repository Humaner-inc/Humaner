import { cookies } from 'next/headers';
import { addMinutes } from 'date-fns';
import type { NextAuthConfig } from 'next-auth';

import { TOTP_AND_RECOVERY_CODES_EXPIRY_MINUTES } from '@/constants/limits';
import { Routes } from '@/constants/routes';
import { adapter } from '@/lib/auth/adapter';
import { AuthCookies } from '@/lib/auth/cookies';
import { symmetricEncrypt } from '@/lib/auth/encryption';
import { AuthErrorCode } from '@/lib/auth/errors';
import {
  generateSessionToken,
  getSessionExpiryFromNow
} from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import {
  IdentityProvider,
  OAuthIdentityProvider
} from '@/types/identity-provider';

async function isAuthenticatorAppEnabled(userId: string): Promise<boolean> {
  const count = await prisma.authenticatorApp.count({
    where: { userId }
  });
  return count > 0;
}

function redirectToTotp(userId: string): string {
  if (!process.env.AUTH_SECRET) {
    console.error(
      'Missing encryption key; cannot proceed with token encryption.'
    );
    return `${Routes.AuthError}?error=${AuthErrorCode.InternalServerError}`;
  }
  const token = symmetricEncrypt(userId, process.env.AUTH_SECRET);
  const expiry = symmetricEncrypt(
    addMinutes(
      new Date(),
      TOTP_AND_RECOVERY_CODES_EXPIRY_MINUTES
    ).toISOString(),
    process.env.AUTH_SECRET
  );
  return `/auth/totp?token=${encodeURIComponent(token)}&expiry=${encodeURIComponent(expiry)}`;
}

export const callbacks = {
  async signIn({ user, account, profile }): Promise<string | boolean> {
    if (!account) {
      return false;
    }
    // All Credentials Provider
    if (account.type === 'credentials') {
      if (!user || !user.id) {
        return false;
      }

      // Only username/password provider
      if (account.provider === IdentityProvider.Credentials) {
        if (await isAuthenticatorAppEnabled(user.id)) {
          return redirectToTotp(user.id);
        }
      }

      const sessionToken = generateSessionToken();
      const sessionExpiry = getSessionExpiryFromNow();

      const createdSession = await adapter.createSession!({
        sessionToken: sessionToken,
        userId: user.id,
        expires: sessionExpiry
      });

      if (!createdSession) {
        return false;
      }

      const cookieStore = await cookies();
      cookieStore.set({
        name: AuthCookies.SessionToken,
        value: sessionToken,
        expires: sessionExpiry,
        httpOnly: true,
        secure: AuthCookies.isSecure,
        sameSite: 'lax',
        path: '/'
      });

      // already authorized
      return true;
    }

    // All OAuth Providers
    if (!account.provider || !profile) {
      return false;
    }

    if (
      !Object.values(OAuthIdentityProvider).includes(
        account.provider.toLowerCase() as OAuthIdentityProvider
      )
    ) {
      return `${Routes.AuthError}?error=${AuthErrorCode.IllegalOAuthProvider}`;
    }

    if (account.provider === OAuthIdentityProvider.Google) {
      if (!profile.email_verified) {
        return `${Routes.AuthError}?error=${AuthErrorCode.UnverifiedEmail}`;
      }
    }

    if (account.provider === OAuthIdentityProvider.GitHub) {
      if (!user.email) {
        return `${Routes.AuthError}?error=${AuthErrorCode.UnverifiedEmail}`;
      }
      // Reject only when GitHub explicitly marks the email unverified.
      if (profile.email_verified === false) {
        return `${Routes.AuthError}?error=${AuthErrorCode.UnverifiedEmail}`;
      }
    }

    if (user?.id && (await isAuthenticatorAppEnabled(user.id))) {
      return redirectToTotp(user.id);
    }

    if (user?.name) {
      user.name = user.name.substring(0, 64);
    }
    if (profile.name) {
      profile.name = profile.name.substring(0, 64);
    }

    return true;
  },
  async jwt({ token, trigger, account, user }) {
    if ((trigger === 'signIn' || trigger === 'signUp') && account) {
      token.accessToken = account.access_token;

      if (account.type === 'credentials' && user.id) {
        // Password login with MFA must not mint a session here — signIn
        // redirects to /auth/totp (or recovery) first. Session is created
        // only after TotpCode / RecoveryCode succeeds (and for password
        // when MFA is off).
        if (
          account.provider === IdentityProvider.Credentials &&
          (await isAuthenticatorAppEnabled(user.id))
        ) {
          return token;
        }

        const expires = getSessionExpiryFromNow();
        const sessionToken = generateSessionToken();

        const session = await adapter.createSession!({
          userId: user.id,
          sessionToken,
          expires
        });

        token.sessionId = session.sessionToken;
      }
    }

    // Let's not allow the client to indirectly update the token using useSession().update()
    if (trigger === 'update') {
      return token;
    }

    return token;
  },
  async session({ trigger, session, user }) {
    if (session && user) {
      session.user.organizationId = user.organizationId;
      session.user.id = user.id;
    }

    // Let's not allow the client to update the session using useSession().update()
    if (trigger === 'update') {
      return session;
    }

    return session;
  }
} satisfies NextAuthConfig['callbacks'];

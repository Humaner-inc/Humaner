import { cookies } from 'next/headers';
import { addMinutes } from 'date-fns';
import type { NextAuthConfig } from 'next-auth';

import { TOTP_AND_RECOVERY_CODES_EXPIRY_MINUTES } from '@/constants/limits';
import { Routes } from '@/constants/routes';
import { adapter } from '@/lib/auth/adapter';
import {
  getSafeAuthCallbackUrl,
  toMfaChallengeRedirect
} from '@/lib/auth/callback-url';
import { AuthCookies } from '@/lib/auth/cookies';
import { symmetricEncrypt } from '@/lib/auth/encryption';
import { AuthErrorCode } from '@/lib/auth/errors';
import { markGmailConnectPrompt } from '@/lib/auth/gmail-connect-prompt';
import { stashOAuthLinkProof } from '@/lib/auth/oauth-link-proof';
import {
  clearSessionCookies,
  writeSessionCookie
} from '@/lib/auth/reassert-session-cookie';
import {
  generateSessionToken,
  getSessionExpiryFromNow
} from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import {
  IdentityProvider,
  OAuthIdentityProvider
} from '@/types/identity-provider';

async function signedInUserId(): Promise<string | null> {
  const sessionToken = (await cookies()).get(AuthCookies.SessionToken)?.value;
  if (!sessionToken) {
    return null;
  }
  const row = await prisma.session.findUnique({
    where: { sessionToken },
    select: { userId: true, expires: true }
  });
  if (!row || row.expires.getTime() <= Date.now()) {
    return null;
  }
  return row.userId;
}

async function isAuthenticatorAppEnabled(userId: string): Promise<boolean> {
  const count = await prisma.authenticatorApp.count({
    where: { userId }
  });
  return count > 0;
}

async function redirectToTotp(userId: string): Promise<string> {
  if (!process.env.AUTH_SECRET) {
    console.error(
      'Missing encryption key; cannot proceed with token encryption.'
    );
    return `${Routes.AuthError}?error=${AuthErrorCode.InternalServerError}`;
  }

  // Drop any half-written session cookie so MFA challenge is not "signed in".
  await clearSessionCookies();

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
          return await redirectToTotp(user.id);
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

      await writeSessionCookie(sessionToken, sessionExpiry);

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
      // Reject only an explicit false — some Google profile payloads omit
      // `email_verified` even for verified Workspace accounts.
      if (profile.email_verified === false) {
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

    const email = (user?.email ?? '').trim().toLowerCase();
    if (account.providerAccountId && email) {
      const linked = await prisma.account.findUnique({
        where: {
          provider_providerAccountId: {
            provider: account.provider,
            providerAccountId: account.providerAccountId
          }
        },
        select: { userId: true }
      });
      if (linked) {
        if (await isAuthenticatorAppEnabled(linked.userId)) {
          return await redirectToTotp(linked.userId);
        }
      } else {
        const existing = await prisma.user.findFirst({
          where: { email: { equals: email, mode: 'insensitive' } },
          select: { id: true }
        });
        if (existing && (await signedInUserId()) !== existing.id) {
          try {
            const proof = await stashOAuthLinkProof({
              userId: existing.id,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              type: account.type,
              access_token: account.access_token,
              refresh_token: account.refresh_token,
              expires_at: account.expires_at,
              token_type: account.token_type,
              scope: account.scope,
              id_token: account.id_token,
              session_state:
                typeof account.session_state === 'string'
                  ? account.session_state
                  : null
            });
            return `${Routes.LinkAccount}?proof=${encodeURIComponent(proof)}`;
          } catch (error) {
            console.error(error);
            return `${Routes.AuthError}?error=${AuthErrorCode.InternalServerError}`;
          }
        }
      }
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
      if (
        trigger === 'signUp' &&
        account.provider === OAuthIdentityProvider.Google
      ) {
        await markGmailConnectPrompt();
      }
      token.accessToken = account.access_token;

      if (user?.id) {
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

        // Prefer the session Auth.js / signIn just created. Attach it so
        // jwt.encode writes the opaque DB token (never a JWT, never '').
        const existing = await prisma.session.findFirst({
          where: {
            userId: user.id,
            expires: { gt: new Date() }
          },
          orderBy: { expires: 'desc' },
          select: { sessionToken: true }
        });

        if (existing) {
          token.sessionId = existing.sessionToken;
          return token;
        }

        // Credentials without MFA: mint if signIn somehow skipped cookie write.
        if (account.type === 'credentials') {
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
    }

    // Let's not allow the client to indirectly update the token using useSession().update()
    if (trigger === 'update') {
      return token;
    }

    return token;
  },
  async session({ trigger, session, user }) {
    if (session && user) {
      let organizationId = user.organizationId;

      // Active workspace was cleared (e.g. that org was deleted). Reattach to
      // another membership so the session remains valid.
      if (!organizationId) {
        const membership = await prisma.organizationMembership.findFirst({
          where: { userId: user.id },
          select: { organizationId: true },
          orderBy: { createdAt: 'asc' }
        });
        if (membership) {
          organizationId = membership.organizationId;
          await prisma.user.update({
            where: { id: user.id },
            data: { organizationId }
          });
        }
      }

      session.user.organizationId = organizationId;
      session.user.id = user.id;
    }

    // Let's not allow the client to update the session using useSession().update()
    if (trigger === 'update') {
      return session;
    }

    return session;
  },
  async redirect({ url, baseUrl }) {
    const mfa = toMfaChallengeRedirect(url);
    if (mfa) {
      return new URL(mfa, baseUrl).toString();
    }

    const safe = getSafeAuthCallbackUrl(url);
    return new URL(safe, baseUrl).toString();
  }
} satisfies NextAuthConfig['callbacks'];

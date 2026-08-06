'use server';

import { cookies } from 'next/headers';
import { AuditActorType } from '@prisma/client';
import { CredentialsSignin } from 'next-auth';
import { returnValidationErrors } from 'next-safe-action';

import { actionClient } from '@/actions/safe-action';
import { Routes } from '@/constants/routes';
import { recordAuditEvent } from '@/lib/audit/record-audit-event';
import { signIn } from '@/lib/auth';
import {
  getSafeAuthCallbackUrl,
  toClientAuthRedirect,
  toMfaChallengeRedirect
} from '@/lib/auth/callback-url';
import { AuthCookies } from '@/lib/auth/cookies';
import { reassertSessionCookieForUser } from '@/lib/auth/reassert-session-cookie';
import { prisma } from '@/lib/db/prisma';
import { passThroughlogInSchema } from '@/schemas/auth/log-in-schema';
import { IdentityProvider } from '@/types/identity-provider';

export const logIn = actionClient
  .metadata({ actionName: 'login' })
  .schema(passThroughlogInSchema)
  .action(async ({ parsedInput }) => {
    const cookieStore = await cookies();
    const fallbackRedirect = getSafeAuthCallbackUrl(
      cookieStore.get(AuthCookies.CallbackUrl)?.value,
      Routes.Home
    );

    try {
      // Auth.js v5 returns a string URL when redirect: false (not { url, error }).
      // That URL is often the Auth.js sign-in page — never trust it alone for
      // client navigation; prefer our safe fallback when it points at /auth.
      // MFA challenge URLs (/auth/totp, /auth/recovery-code) are an exception.
      const result = await signIn(IdentityProvider.Credentials, {
        email: parsedInput.email,
        password: parsedInput.password,
        redirectTo: fallbackRedirect,
        redirect: false
      });

      const redirectTo = toClientAuthRedirect(result, fallbackRedirect);

      // Password was accepted but authenticator is required — do not mint or
      // revive a session cookie before the TOTP / recovery step completes.
      if (toMfaChallengeRedirect(redirectTo)) {
        return { redirectTo };
      }

      const user = await prisma.user.findFirst({
        where: { email: parsedInput.email.toLowerCase() },
        select: {
          id: true,
          organizationId: true,
          organizationMemberships: { select: { id: true }, take: 1 }
        }
      });
      if (user) {
        await reassertSessionCookieForUser(user.id);
        if (!user.organizationId && user.organizationMemberships.length === 0) {
          return { redirectTo: Routes.NoWorkspace };
        }
      }

      return { redirectTo };
    } catch (e) {
      if (e instanceof CredentialsSignin) {
        const user = await prisma.user.findFirst({
          where: { email: parsedInput.email.toLowerCase() },
          select: { id: true, organizationId: true, email: true }
        });
        if (user?.organizationId) {
          await recordAuditEvent({
            organizationId: user.organizationId,
            eventType: 'user.login_failed',
            actorType: AuditActorType.USER,
            actorId: user.id,
            actorEmail: user.email,
            resourceType: 'user',
            resourceId: user.id,
            metadata: { reason: e.code ?? 'credentials' }
          });
        }

        return returnValidationErrors(passThroughlogInSchema, {
          _errors: [e.code]
        });
      }
      throw e;
    }
  });

'use server';

import { Authenticator } from '@otplib/core';
import { createDigest, createRandomBytes } from '@otplib/plugin-crypto';
import { keyDecoder, keyEncoder } from '@otplib/plugin-thirty-two';
import { returnValidationErrors } from 'next-safe-action';

import { actionClient } from '@/actions/safe-action';
import { adapter } from '@/lib/auth/adapter';
import { symmetricDecrypt } from '@/lib/auth/encryption';
import {
  consumeOAuthLinkProof,
  readOAuthLinkProof
} from '@/lib/auth/oauth-link-proof';
import { verifyPassword } from '@/lib/auth/password';
import { forceSessionCookieForUser } from '@/lib/auth/reassert-session-cookie';
import { prisma } from '@/lib/db/prisma';
import { rateLimit } from '@/lib/network/rate-limit';
import { incrementRateLimit } from '@/lib/redis/upstash';
import { getSignedInHomePath } from '@/lib/routes/signed-in-home';
import { sendConnectedAccountSecurityAlertEmail } from '@/lib/smtp/send-connected-account-security-alert-email';
import { confirmOAuthLinkSchema } from '@/schemas/auth/confirm-oauth-link-schema';

const linkLimiter = rateLimit({ intervalInMs: 60 * 1000 });

export const confirmOAuthLink = actionClient
  .metadata({ actionName: 'confirmOAuthLink' })
  .schema(confirmOAuthLinkSchema)
  .action(async ({ parsedInput }) => {
    const payload = await readOAuthLinkProof(parsedInput.proof);
    if (!payload) {
      return returnValidationErrors(confirmOAuthLinkSchema, {
        _errors: ['This link request expired. Sign in with the provider again.']
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        authenticatorApp: { select: { secret: true } }
      }
    });
    if (!user?.email) {
      return returnValidationErrors(confirmOAuthLinkSchema, {
        _errors: ['This link request expired. Sign in with the provider again.']
      });
    }

    const attempts = await incrementRateLimit(`login:link:${user.email}`, 60);
    const memoryLimited =
      attempts === 0 &&
      linkLimiter.check(10, user.email.toLowerCase()).isRateLimited;
    if (attempts >= 10 || memoryLimited) {
      return returnValidationErrors(confirmOAuthLinkSchema, {
        _errors: ['Too many attempts. Wait a minute and try again.']
      });
    }

    if (user.authenticatorApp) {
      const code = parsedInput.totpCode?.replace(/\s/g, '') ?? '';
      if (!/^\d{6}$/.test(code) || !process.env.AUTH_SECRET) {
        return returnValidationErrors(confirmOAuthLinkSchema, {
          totpCode: {
            _errors: ['Enter the 6-digit code from your authenticator.']
          }
        });
      }
      const secret = symmetricDecrypt(
        user.authenticatorApp.secret,
        process.env.AUTH_SECRET
      );
      const authenticator = new Authenticator({
        createDigest,
        createRandomBytes,
        keyDecoder,
        keyEncoder,
        window: [1, 0]
      });
      if (!authenticator.check(code, secret)) {
        return returnValidationErrors(confirmOAuthLinkSchema, {
          totpCode: { _errors: ['That code is incorrect.'] }
        });
      }
    } else if (user.password) {
      const password = parsedInput.password ?? '';
      if (!password || !(await verifyPassword(password, user.password))) {
        return returnValidationErrors(confirmOAuthLinkSchema, {
          password: { _errors: ['That password is incorrect.'] }
        });
      }
    } else {
      return returnValidationErrors(confirmOAuthLinkSchema, {
        _errors: [
          'Sign in with the provider already on this account, then connect the new one from security settings.'
        ]
      });
    }

    const already = await prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: payload.provider,
          providerAccountId: payload.providerAccountId
        }
      },
      select: { userId: true }
    });
    if (already && already.userId !== user.id) {
      return returnValidationErrors(confirmOAuthLinkSchema, {
        _errors: ['That provider account is already linked to someone else.']
      });
    }
    if (!already) {
      await adapter.linkAccount({
        userId: user.id,
        type: payload.type === 'oidc' ? 'oidc' : 'oauth',
        provider: payload.provider,
        providerAccountId: payload.providerAccountId,
        access_token: payload.access_token ?? undefined,
        refresh_token: payload.refresh_token ?? undefined,
        expires_at: payload.expires_at ?? undefined,
        token_type: payload.token_type
          ? (payload.token_type.toLowerCase() as Lowercase<string>)
          : undefined,
        scope: payload.scope ?? undefined,
        id_token: payload.id_token ?? undefined,
        session_state: payload.session_state ?? undefined
      });
    }

    await consumeOAuthLinkProof(parsedInput.proof);
    await forceSessionCookieForUser(user.id);

    try {
      await sendConnectedAccountSecurityAlertEmail({
        recipient: user.email,
        name: user.name,
        action: 'connected',
        provider: payload.provider
      });
    } catch (error) {
      console.error(error);
    }

    return { redirectTo: getSignedInHomePath() };
  });

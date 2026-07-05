import 'server-only';

import { cookies } from 'next/headers';
import { addMinutes } from 'date-fns';

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

async function isAuthenticatorAppEnabled(userId: string): Promise<boolean> {
  const count = await prisma.authenticatorApp.count({
    where: { userId }
  });
  return count > 0;
}

export async function establishUserSession(
  userId: string
): Promise<{ redirectTo?: string }> {
  if (await isAuthenticatorAppEnabled(userId)) {
    if (!process.env.AUTH_SECRET) {
      throw new Error(AuthErrorCode.InternalServerError);
    }

    const token = symmetricEncrypt(userId, process.env.AUTH_SECRET);
    const expiry = symmetricEncrypt(
      addMinutes(
        new Date(),
        TOTP_AND_RECOVERY_CODES_EXPIRY_MINUTES
      ).toISOString(),
      process.env.AUTH_SECRET
    );

    return {
      redirectTo: `/auth/totp?token=${encodeURIComponent(token)}&expiry=${encodeURIComponent(expiry)}`
    };
  }

  const sessionToken = generateSessionToken();
  const sessionExpiry = getSessionExpiryFromNow();

  const createdSession = await adapter.createSession!({
    sessionToken,
    userId,
    expires: sessionExpiry
  });

  if (!createdSession) {
    throw new Error(AuthErrorCode.InternalServerError);
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

  return {};
}

export function getPostVerificationRedirect(input: {
  completedOnboarding: boolean;
  organizationCompletedOnboarding: boolean;
}): string {
  if (input.completedOnboarding && input.organizationCompletedOnboarding) {
    return Routes.Home;
  }

  return Routes.Onboarding;
}

import 'server-only';

import { addMinutes } from 'date-fns';

import { TOTP_AND_RECOVERY_CODES_EXPIRY_MINUTES } from '@/constants/limits';
import { Routes } from '@/constants/routes';
import { adapter } from '@/lib/auth/adapter';
import { symmetricEncrypt } from '@/lib/auth/encryption';
import { AuthErrorCode } from '@/lib/auth/errors';
import {
  clearSessionCookies,
  writeSessionCookie
} from '@/lib/auth/reassert-session-cookie';
import {
  generateSessionToken,
  getSessionExpiryFromNow
} from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { getSignedInHomePath } from '@/lib/routes/signed-in-home';

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

    await clearSessionCookies();

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

  await writeSessionCookie(sessionToken, sessionExpiry);

  return {};
}

export function getPostVerificationRedirect(input: {
  completedOnboarding: boolean;
  organizationCompletedOnboarding: boolean;
  hasOrganization: boolean;
}): string {
  if (!input.hasOrganization) {
    // Team-member accounts finish preferences / workspace request first.
    if (!input.completedOnboarding) {
      return Routes.Onboarding;
    }
    return Routes.NoWorkspace;
  }

  if (input.completedOnboarding && input.organizationCompletedOnboarding) {
    return getSignedInHomePath();
  }

  return Routes.Onboarding;
}

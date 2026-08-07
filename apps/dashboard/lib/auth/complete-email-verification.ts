import 'server-only';

import { addMinutes, isAfter } from 'date-fns';

import { TOTP_AND_RECOVERY_CODES_EXPIRY_MINUTES } from '@/constants/limits';
import { Routes } from '@/constants/routes';
import { symmetricEncrypt } from '@/lib/auth/encryption';
import { AuthErrorCode } from '@/lib/auth/errors';
import { getPostVerificationRedirect } from '@/lib/auth/establish-user-session';
import { createHash } from '@/lib/auth/utils';
import { verifyEmail } from '@/lib/auth/verification';
import { prisma } from '@/lib/db/prisma';
import { sendWelcomeEmail } from '@/lib/smtp/send-welcome-email';
import { NotFoundError } from '@/lib/validation/exceptions';

type CompleteEmailVerificationInput =
  | { type: 'otp'; otp: string; email: string }
  | { type: 'token'; token: string };

export type EmailVerificationSignInHandshake = {
  token: string;
  expiry: string;
  redirectTo: string;
};

export type CompleteEmailVerificationResult =
  | { kind: 'redirect'; redirectTo: string }
  | { kind: 'signIn'; handshake: EmailVerificationSignInHandshake };

async function isAuthenticatorAppEnabled(userId: string): Promise<boolean> {
  const count = await prisma.authenticatorApp.count({
    where: { userId }
  });
  return count > 0;
}

function buildTotpRedirect(userId: string): string {
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

  return `/auth/totp?token=${encodeURIComponent(token)}&expiry=${encodeURIComponent(expiry)}`;
}

function buildSignInHandshake(
  userId: string,
  redirectTo: string
): EmailVerificationSignInHandshake {
  if (!process.env.AUTH_SECRET) {
    throw new Error(AuthErrorCode.InternalServerError);
  }

  return {
    token: symmetricEncrypt(userId, process.env.AUTH_SECRET),
    expiry: symmetricEncrypt(
      addMinutes(new Date(), 5).toISOString(),
      process.env.AUTH_SECRET
    ),
    redirectTo
  };
}

export async function completeEmailVerification(
  input: CompleteEmailVerificationInput
): Promise<CompleteEmailVerificationResult> {
  const verificationToken =
    input.type === 'otp'
      ? await prisma.verificationToken.findFirst({
          where: {
            identifier: input.email.toLowerCase(),
            token: await createHash(
              `${input.otp.trim()}${process.env.AUTH_SECRET}`
            )
          },
          select: { identifier: true, expires: true }
        })
      : await prisma.verificationToken.findFirst({
          where: { token: input.token },
          select: { identifier: true, expires: true }
        });

  if (!verificationToken) {
    throw new NotFoundError('Verification token not found.');
  }

  const user = await prisma.user.findFirst({
    where: { email: verificationToken.identifier },
    select: {
      id: true,
      email: true,
      name: true,
      emailVerified: true,
      completedOnboarding: true,
      organizationId: true,
      organization: { select: { completedOnboarding: true } },
      organizationMemberships: { select: { id: true }, take: 1 }
    }
  });

  if (!user) {
    throw new NotFoundError('User not found.');
  }

  const redirectTo = getPostVerificationRedirect({
    completedOnboarding: user.completedOnboarding,
    organizationCompletedOnboarding:
      user.organization?.completedOnboarding ?? false,
    hasOrganization:
      Boolean(user.organizationId) || user.organizationMemberships.length > 0
  });

  if (!user.emailVerified) {
    if (isAfter(new Date(), verificationToken.expires)) {
      return {
        kind: 'redirect',
        redirectTo: `${Routes.VerifyEmailExpired}?email=${verificationToken.identifier}`
      };
    }

    await verifyEmail(verificationToken.identifier);

    await sendWelcomeEmail({
      name: user.name,
      recipient: user.email!
    });
  }

  if (await isAuthenticatorAppEnabled(user.id)) {
    return {
      kind: 'redirect',
      redirectTo: buildTotpRedirect(user.id)
    };
  }

  return {
    kind: 'signIn',
    handshake: buildSignInHandshake(user.id, redirectTo)
  };
}

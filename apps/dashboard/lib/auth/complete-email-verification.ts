import 'server-only';

import { isAfter } from 'date-fns';

import { Routes } from '@/constants/routes';
import {
  establishUserSession,
  getPostVerificationRedirect
} from '@/lib/auth/establish-user-session';
import { createHash } from '@/lib/auth/utils';
import { verifyEmail } from '@/lib/auth/verification';
import { prisma } from '@/lib/db/prisma';
import { sendWelcomeEmail } from '@/lib/smtp/send-welcome-email';
import { NotFoundError } from '@/lib/validation/exceptions';

type CompleteEmailVerificationInput =
  | { type: 'otp'; otp: string }
  | { type: 'token'; token: string };

export async function completeEmailVerification(
  input: CompleteEmailVerificationInput
): Promise<{ redirectTo: string }> {
  const verificationToken =
    input.type === 'otp'
      ? await prisma.verificationToken.findFirst({
          where: {
            token: await createHash(
              `${input.otp.toUpperCase()}${process.env.AUTH_SECRET}`
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
      organization: { select: { completedOnboarding: true } }
    }
  });

  if (!user) {
    throw new NotFoundError('User not found.');
  }

  const redirectAfterSession = (): string =>
    getPostVerificationRedirect({
      completedOnboarding: user.completedOnboarding,
      organizationCompletedOnboarding:
        user.organization?.completedOnboarding ?? false
    });

  if (user.emailVerified) {
    const sessionRedirect = await establishUserSession(user.id);
    return {
      redirectTo: sessionRedirect.redirectTo ?? redirectAfterSession()
    };
  }

  if (isAfter(new Date(), verificationToken.expires)) {
    return {
      redirectTo: `${Routes.VerifyEmailExpired}?email=${verificationToken.identifier}`
    };
  }

  await verifyEmail(verificationToken.identifier);

  await sendWelcomeEmail({
    name: user.name,
    recipient: user.email!
  });

  const sessionRedirect = await establishUserSession(user.id);

  return {
    redirectTo: sessionRedirect.redirectTo ?? redirectAfterSession()
  };
}

'use server';

import { addMinutes } from 'date-fns';

import { actionClient } from '@/actions/safe-action';
import { EMAIL_VERIFICATION_EXPIRY_MINUTES } from '@/constants/limits';
import { Routes } from '@/constants/routes';
import { requireAuthSecret } from '@/lib/auth/auth-secret';
import {
  assertEmailVerificationResendRateLimit,
  generateEmailVerificationOtp
} from '@/lib/auth/email-verification-otp';
import { logVerificationCodeForLocalDev } from '@/lib/auth/log-verification-code';
import { createHash } from '@/lib/auth/utils';
import { prisma } from '@/lib/db/prisma';
import { sendVerifyEmailAddressEmail } from '@/lib/smtp/send-verify-email-address-email';
import { getBaseUrl } from '@/lib/urls/get-base-url';
import { resendEmailConfirmationSchema } from '@/schemas/auth/resend-email-confirmation-schema';

export const resendEmailConfirmation = actionClient
  .metadata({ actionName: 'resendEmailConfirmation' })
  .schema(resendEmailConfirmationSchema)
  .action(async ({ parsedInput }) => {
    const normalizedEmail = parsedInput.email.toLowerCase();
    const maybeUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        name: true,
        email: true,
        emailVerified: true
      }
    });
    if (!maybeUser || !maybeUser.email || maybeUser.emailVerified) {
      // Do not throw error or notify the user, we don't want to leak if a certain email exist
      return;
    }

    assertEmailVerificationResendRateLimit(normalizedEmail);

    const otp = generateEmailVerificationOtp();
    const hashedOtp = await createHash(`${otp}${requireAuthSecret()}`);
    const verificationLink = `${getBaseUrl()}${Routes.VerifyEmailRequest}/${hashedOtp}`;

    await prisma.verificationToken.deleteMany({
      where: { identifier: normalizedEmail }
    });

    await prisma.verificationToken.create({
      data: {
        identifier: normalizedEmail,
        token: hashedOtp,
        expires: addMinutes(new Date(), EMAIL_VERIFICATION_EXPIRY_MINUTES)
      },
      select: {
        identifier: true // SELECT NONE
      }
    });

    logVerificationCodeForLocalDev({
      email: maybeUser.email,
      otp,
      verificationLink
    });

    await sendVerifyEmailAddressEmail({
      recipient: maybeUser.email,
      name: maybeUser.name,
      otp,
      verificationLink
    });
  });

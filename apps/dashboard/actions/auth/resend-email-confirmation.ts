'use server';

import { addHours } from 'date-fns';

import { actionClient } from '@/actions/safe-action';
import { EMAIL_VERIFICATION_EXPIRY_HOURS } from '@/constants/limits';
import { Routes } from '@/constants/routes';
import { createHash, randomString } from '@/lib/auth/utils';
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

    const otp = randomString(3).toUpperCase();
    const hashedOtp = await createHash(`${otp}${process.env.AUTH_SECRET}`);

    await prisma.verificationToken.create({
      data: {
        identifier: normalizedEmail,
        token: hashedOtp,
        expires: addHours(new Date(), EMAIL_VERIFICATION_EXPIRY_HOURS)
      },
      select: {
        identifier: true // SELECT NONE
      }
    });

    await sendVerifyEmailAddressEmail({
      recipient: maybeUser.email,
      name: maybeUser.name,
      otp,
      verificationLink: `${getBaseUrl()}${Routes.VerifyEmailRequest}/${hashedOtp}`
    });
  });

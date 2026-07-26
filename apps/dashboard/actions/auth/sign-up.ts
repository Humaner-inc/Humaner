'use server';

import { addHours } from 'date-fns';
import { returnValidationErrors } from 'next-safe-action';

import { actionClient } from '@/actions/safe-action';
import { EMAIL_VERIFICATION_EXPIRY_HOURS } from '@/constants/limits';
import { Routes } from '@/constants/routes';
import { createUserWithOrganization } from '@/lib/auth/organization';
import { hashPassword } from '@/lib/auth/password';
import { createHash, randomString } from '@/lib/auth/utils';
import { prisma } from '@/lib/db/prisma';
import { sendVerifyEmailAddressEmail } from '@/lib/smtp/send-verify-email-address-email';
import { getBaseUrl } from '@/lib/urls/get-base-url';
import { signUpSchema } from '@/schemas/auth/sign-up-schema';

export const signUp = actionClient
  .metadata({ actionName: 'signUp' })
  .schema(signUpSchema)
  .action(async ({ parsedInput }) => {
    const normalizedEmail = parsedInput.email.toLowerCase();
    const redirectTo = `${Routes.VerifyEmail}?email=${encodeURIComponent(parsedInput.email)}`;

    const existingUser = await prisma.user.findFirst({
      where: { email: normalizedEmail },
      select: { id: true, emailVerified: true }
    });

    if (existingUser) {
      if (existingUser.emailVerified) {
        return returnValidationErrors(signUpSchema, {
          email: {
            _errors: ['Email address is already taken.']
          }
        });
      }
      return { redirectTo };
    }

    const hashedPassword = await hashPassword(parsedInput.password);

    try {
      await createUserWithOrganization({
        name: parsedInput.name,
        email: normalizedEmail,
        hashedPassword,
        locale: 'en-US'
      });
    } catch (e) {
      console.error('[sign-up] createUserWithOrganization error:', e);
      const userCreatedAnyway = await prisma.user.findFirst({
        where: { email: normalizedEmail },
        select: { id: true }
      });
      if (userCreatedAnyway) {
        return { redirectTo };
      }
      throw e;
    }

    try {
      const otp = randomString(3).toUpperCase();
      const hashedOtp = await createHash(`${otp}${process.env.AUTH_SECRET}`);

      await prisma.verificationToken.create({
        data: {
          identifier: normalizedEmail,
          token: hashedOtp,
          expires: addHours(new Date(), EMAIL_VERIFICATION_EXPIRY_HOURS)
        },
        select: {
          identifier: true
        }
      });

      await sendVerifyEmailAddressEmail({
        recipient: normalizedEmail,
        name: parsedInput.name,
        otp,
        verificationLink: `${getBaseUrl()}${Routes.VerifyEmailRequest}/${hashedOtp}`
      });
    } catch (e) {
      console.error('[sign-up] verification email error:', e);
    }

    return { redirectTo };
  });

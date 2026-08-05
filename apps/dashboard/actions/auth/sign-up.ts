'use server';

import { InvitationStatus } from '@prisma/client';
import { addHours } from 'date-fns';
import { returnValidationErrors } from 'next-safe-action';

import { actionClient } from '@/actions/safe-action';
import { EMAIL_VERIFICATION_EXPIRY_HOURS } from '@/constants/limits';
import { Routes } from '@/constants/routes';
import { signIn } from '@/lib/auth';
import {
  createUserWithOrganization,
  createUserWithoutOrganization,
  joinOrganization
} from '@/lib/auth/organization';
import { hashPassword } from '@/lib/auth/password';
import { createHash, randomString } from '@/lib/auth/utils';
import { prisma } from '@/lib/db/prisma';
import { sendVerifyEmailAddressEmail } from '@/lib/smtp/send-verify-email-address-email';
import { getBaseUrl } from '@/lib/urls/get-base-url';
import { signUpSchema } from '@/schemas/auth/sign-up-schema';
import { IdentityProvider } from '@/types/identity-provider';

export const signUp = actionClient
  .metadata({ actionName: 'signUp' })
  .schema(signUpSchema)
  .action(async ({ parsedInput }) => {
    const normalizedEmail = parsedInput.email.toLowerCase();
    const intent = parsedInput.intent ?? 'business_owner';
    const invitationId = parsedInput.invitationId?.trim() || undefined;

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
      return {
        redirectTo: `${Routes.VerifyEmail}?email=${encodeURIComponent(parsedInput.email)}`
      };
    }

    const hashedPassword = await hashPassword(parsedInput.password);

    // Invited team member — create account on the workspace and sign in.
    if (intent === 'team_member' && invitationId) {
      const invitation = await prisma.invitation.findFirst({
        where: { id: invitationId },
        select: {
          status: true,
          email: true,
          role: true,
          allowedPages: true,
          organizationId: true
        }
      });

      if (!invitation || invitation.status !== InvitationStatus.PENDING) {
        return returnValidationErrors(signUpSchema, {
          invitationId: {
            _errors: ['This invitation is no longer valid.']
          }
        });
      }

      if (invitation.email.toLowerCase() !== normalizedEmail) {
        return returnValidationErrors(signUpSchema, {
          email: {
            _errors: ['Use the email address this invitation was sent to.']
          }
        });
      }

      await joinOrganization({
        invitationId,
        organizationId: invitation.organizationId,
        name: parsedInput.name,
        normalizedEmail,
        hashedPassword,
        role: invitation.role,
        allowedPages: invitation.allowedPages
      });

      return await signIn(IdentityProvider.Credentials, {
        email: parsedInput.email,
        password: parsedInput.password,
        redirect: true,
        redirectTo: Routes.Onboarding
      });
    }

    try {
      if (intent === 'team_member') {
        await createUserWithoutOrganization({
          name: parsedInput.name,
          email: normalizedEmail,
          hashedPassword,
          locale: 'en-US'
        });
      } else {
        await createUserWithOrganization({
          name: parsedInput.name,
          email: normalizedEmail,
          hashedPassword,
          locale: 'en-US'
        });
      }
    } catch (e) {
      console.error('[sign-up] create user error:', e);
      const userCreatedAnyway = await prisma.user.findFirst({
        where: { email: normalizedEmail },
        select: { id: true }
      });
      if (userCreatedAnyway) {
        return {
          redirectTo: `${Routes.VerifyEmail}?email=${encodeURIComponent(parsedInput.email)}`
        };
      }
      throw e;
    }

    const redirectTo = `${Routes.VerifyEmail}?email=${encodeURIComponent(parsedInput.email)}`;

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

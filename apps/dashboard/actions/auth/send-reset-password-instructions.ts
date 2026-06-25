'use server';

import { ResetPasswordRequest } from '@prisma/client';
import { addHours } from 'date-fns';

import { actionClient } from '@/actions/safe-action';
import { PASSWORD_RESET_EXPIRY_HOURS } from '@/constants/limits';
import { Routes } from '@/constants/routes';
import { prisma } from '@/lib/db/prisma';
import { sendPasswordResetEmail } from '@/lib/smtp/send-password-reset-email';
import { getBaseUrl } from '@/lib/urls/get-base-url';
import { sendResetPasswordInstructionsSchema } from '@/schemas/auth/send-reset-password-instructions-schema';

export const sendResetPasswordInstructions = actionClient
  .metadata({ actionName: 'sendResetPasswordInstructions' })
  .schema(sendResetPasswordInstructionsSchema)
  .action(async ({ parsedInput }) => {
    const normalizedEmail = parsedInput.email.toLowerCase();
    const maybeUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        name: true,
        email: true,
        locale: true
      }
    });
    if (!maybeUser || !maybeUser.email) {
      // Don't leak information about whether an email is registered or not
      return;
    }

    const now = new Date();
    const maybePreviousRequest = await prisma.resetPasswordRequest.findMany({
      where: {
        email: maybeUser.email,
        expires: { gt: now }
      }
    });

    let passwordRequest: ResetPasswordRequest;

    if (maybePreviousRequest && maybePreviousRequest?.length >= 1) {
      passwordRequest = maybePreviousRequest[0];
    } else {
      const expiry = addHours(new Date(), PASSWORD_RESET_EXPIRY_HOURS);
      const createdResetPasswordRequest =
        await prisma.resetPasswordRequest.create({
          data: {
            email: maybeUser.email,
            expires: expiry
          }
        });
      passwordRequest = createdResetPasswordRequest;
    }

    await sendPasswordResetEmail({
      recipient: maybeUser.email,
      name: maybeUser.name,
      resetPasswordLink: `${getBaseUrl()}${Routes.ResetPasswordRequest}/${passwordRequest.id}`
    });
  });

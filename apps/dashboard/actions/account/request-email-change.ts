'use server';

import { InvitationStatus } from '@prisma/client';
import { addHours } from 'date-fns';

import { authActionClient } from '@/actions/safe-action';
import { EMAIL_CHANGE_EXPIRY_HOURS } from '@/constants/limits';
import { Routes } from '@/constants/routes';
import { prisma } from '@/lib/db/prisma';
import { sendConfirmEmailAddressChangeEmail } from '@/lib/smtp/send-confirm-email-address-change-email';
import { getBaseUrl } from '@/lib/urls/get-base-url';
import { PreConditionError } from '@/lib/validation/exceptions';
import { requestEmailChangeSchema } from '@/schemas/account/request-email-change-schema';

export const requestEmailChange = authActionClient
  .metadata({ actionName: 'requestEmailChange' })
  .schema(requestEmailChangeSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const [countUsers, countInvitations] = await prisma.$transaction([
      prisma.user.count({
        where: { email: parsedInput.email }
      }),
      prisma.invitation.count({
        where: {
          email: parsedInput.email,
          organizationId: session.user.organizationId,
          AND: [
            { NOT: { status: { equals: InvitationStatus.ACCEPTED } } },
            { NOT: { status: { equals: InvitationStatus.REVOKED } } }
          ]
        }
      })
    ]);
    const isAvailable = countUsers === 0 && countInvitations === 0;
    if (!isAvailable) {
      throw new PreConditionError('Email address is already taken');
    }

    const expiry = addHours(new Date(), EMAIL_CHANGE_EXPIRY_HOURS);
    const normalizedEmail = parsedInput.email.toLowerCase();

    const [, request] = await prisma.$transaction([
      prisma.changeEmailRequest.updateMany({
        where: { userId: session.user.id },
        data: { valid: false }
      }),
      prisma.changeEmailRequest.create({
        data: {
          userId: session.user.id,
          email: normalizedEmail,
          valid: true,
          expires: expiry
        },
        select: {
          id: true // SELECT NONE
        }
      })
    ]);

    await sendConfirmEmailAddressChangeEmail({
      recipient: normalizedEmail,
      name: session.user.name,
      confirmLink: `${getBaseUrl()}${Routes.ChangeEmailRequest}/${request.id}`
    });
  });

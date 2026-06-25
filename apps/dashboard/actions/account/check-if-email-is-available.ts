'use server';

import { InvitationStatus } from '@prisma/client';

import { authActionClient } from '@/actions/safe-action';
import { prisma } from '@/lib/db/prisma';
import { checkIfEmailIsAvailableSchema } from '@/schemas/account/check-if-email-is-available-schema';

// This is a server action (instead of server function) on purpose:
// We shouldn't cache the result.

export const checkIfEmailIsAvailable = authActionClient
  .metadata({ actionName: 'checkIfEmailIsAvailable' })
  .schema(checkIfEmailIsAvailableSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const normalizedEmail = parsedInput.email.toLowerCase();
    const [countUsers, countInvitations] = await prisma.$transaction([
      prisma.user.count({
        where: { email: normalizedEmail }
      }),
      prisma.invitation.count({
        where: {
          email: normalizedEmail,
          organizationId: session.user.organizationId,
          AND: [
            { NOT: { status: { equals: InvitationStatus.ACCEPTED } } },
            { NOT: { status: { equals: InvitationStatus.REVOKED } } }
          ]
        }
      })
    ]);

    return { isAvailable: countUsers === 0 && countInvitations === 0 };
  });

'use server';

import { redirect } from 'next/navigation';
import { isAfter } from 'date-fns';

import { actionClient } from '@/actions/safe-action';
import { Routes } from '@/constants/routes';
import { prisma } from '@/lib/db/prisma';
import { NotFoundError } from '@/lib/validation/exceptions';
import { changeEmailSchema } from '@/schemas/account/change-email-schema';

export const changeEmail = actionClient
  .metadata({ actionName: 'changeEmail' })
  .schema(changeEmailSchema)
  .action(async ({ parsedInput }) => {
    const request = await prisma.changeEmailRequest.findFirst({
      where: { id: parsedInput.id },
      select: {
        userId: true,
        email: true,
        valid: true,
        expires: true
      }
    });
    if (!request) {
      throw new NotFoundError('Change email request not found');
    }

    if (!request.valid) {
      return redirect(Routes.ChangeEmailInvalid);
    }

    if (isAfter(new Date(), request.expires)) {
      return redirect(Routes.ChangeEmailExpired);
    }

    await prisma.$transaction([
      prisma.changeEmailRequest.updateMany({
        where: { id: parsedInput.id },
        data: { valid: false }
      }),
      prisma.session.deleteMany({
        where: { userId: request.userId }
      }),
      prisma.user.update({
        where: { id: request.userId },
        data: { email: request.email },
        select: {
          id: true // SELECT NONE
        }
      })
    ]);
  });

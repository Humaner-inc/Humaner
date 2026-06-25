'use server';

import { redirect } from 'next/navigation';

import { actionClient } from '@/actions/safe-action';
import { Routes } from '@/constants/routes';
import { hashPassword } from '@/lib/auth/password';
import { prisma } from '@/lib/db/prisma';
import { NotFoundError } from '@/lib/validation/exceptions';
import { resetPasswordSchema } from '@/schemas/auth/reset-password-schema';

export const resetPassword = actionClient
  .metadata({ actionName: 'resetPassword' })
  .schema(resetPasswordSchema)
  .action(async ({ parsedInput }) => {
    const maybeRequest = await prisma.resetPasswordRequest.findUnique({
      where: { id: parsedInput.requestId }
    });
    if (!maybeRequest) {
      throw new NotFoundError('Reset password request not found');
    }

    const normalizedEmail = maybeRequest.email.toLowerCase();
    const maybeUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });
    if (!maybeUser) {
      throw new NotFoundError("Couldn't find an account for this email");
    }

    const now = new Date();
    const hashedPassword = await hashPassword(parsedInput.password);

    await prisma.$transaction([
      prisma.resetPasswordRequest.update({
        where: { id: parsedInput.requestId },
        data: { expires: now },
        select: {
          id: true // SELECT NONE
        }
      }),
      prisma.user.update({
        where: { id: maybeUser.id },
        data: { password: hashedPassword },
        select: {
          id: true // SELECT NONE
        }
      })
    ]);

    return redirect(Routes.ResetPasswordSuccess);
  });

'use server';

import { revalidatePath } from 'next/cache';
import { returnValidationErrors } from 'next-safe-action';

import { authActionClient } from '@/actions/safe-action';
import { Routes } from '@/constants/routes';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { prisma } from '@/lib/db/prisma';
import { NotFoundError } from '@/lib/validation/exceptions';
import { changePasswordSchema } from '@/schemas/account/change-password-schema';

export const changePassword = authActionClient
  .metadata({ actionName: 'changePassword' })
  .schema(changePasswordSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const userFromDb = await prisma.user.findFirst({
      where: { id: session.user.id },
      select: { password: true }
    });
    if (!userFromDb) {
      throw new NotFoundError('User not found');
    }

    if (userFromDb.password) {
      const passwordsMatch = await verifyPassword(
        parsedInput.currentPassword ?? '',
        userFromDb.password
      );
      if (!passwordsMatch) {
        return returnValidationErrors(changePasswordSchema, {
          currentPassword: {
            _errors: ['Current password is not correct.']
          }
        });
      }
    }
    if (parsedInput.currentPassword === parsedInput.newPassword) {
      return returnValidationErrors(changePasswordSchema, {
        newPassword: {
          _errors: [
            'New password matches your old password. Please choose a different password.'
          ]
        }
      });
    }

    const password = await hashPassword(parsedInput.newPassword);

    await prisma.user.update({
      where: { id: session.user.id },
      data: { password },
      select: {
        id: true // SELECT NONE
      }
    });

    revalidatePath(Routes.Security);
  });

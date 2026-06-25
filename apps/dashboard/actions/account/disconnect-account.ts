'use server';

import { revalidatePath } from 'next/cache';

import { authActionClient } from '@/actions/safe-action';
import { Routes } from '@/constants/routes';
import { prisma } from '@/lib/db/prisma';
import { sendConnectedAccountSecurityAlertEmail } from '@/lib/smtp/send-connected-account-security-alert-email';
import { NotFoundError } from '@/lib/validation/exceptions';
import { disconnectAccountSchema } from '@/schemas/account/disconnect-account-schema';
import {
  identityProviderFriendlyNames,
  OAuthIdentityProvider
} from '@/types/identity-provider';

export const disconnectAccount = authActionClient
  .metadata({ actionName: 'disconnectAccount' })
  .schema(disconnectAccountSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const normalizedProvider = parsedInput.provider.toLowerCase();
    const account = await prisma.account.findFirst({
      where: {
        provider: normalizedProvider,
        user: { id: session.user.id }
      },
      select: {
        id: true,
        provider: true
      }
    });
    if (!account) {
      throw new NotFoundError('Account not found');
    }
    await prisma.account.delete({
      where: { id: account.id },
      select: {
        id: true // SELECT NONE
      }
    });

    try {
      await sendConnectedAccountSecurityAlertEmail({
        recipient: session.user.email,
        name: session.user.name,
        provider:
          identityProviderFriendlyNames[
            account.provider as OAuthIdentityProvider
          ],
        action: 'disconnected'
      });
    } catch (e) {
      console.error(e);
    }

    revalidatePath(Routes.Security);
  });

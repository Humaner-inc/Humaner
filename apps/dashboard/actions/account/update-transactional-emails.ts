'use server';

import { revalidateTag } from 'next/cache';

import { authActionClient } from '@/actions/safe-action';
import { Caching, UserCacheKey } from '@/data/caching';
import { prisma } from '@/lib/db/prisma';
import { updateTransactionalEmailsSchema } from '@/schemas/account/update-transactional-emails-schema';

export const updateTransactionalEmails = authActionClient
  .metadata({ actionName: 'updateTransactionalEmails' })
  .schema(updateTransactionalEmailsSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        enabledContactsNotifications: parsedInput.enabledContactsNotifications,
        enabledInboxNotifications: parsedInput.enabledInboxNotifications,
        enabledWeeklySummary: parsedInput.enabledWeeklySummary
      },
      select: {
        id: true // SELECT NONE
      }
    });

    revalidateTag(
      Caching.createUserTag(UserCacheKey.TransactionalEmails, session.user.id)
    );
  });

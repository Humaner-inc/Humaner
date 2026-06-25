'use server';

import { revalidateTag } from 'next/cache';

import { authActionClient } from '@/actions/safe-action';
import { Caching, UserCacheKey } from '@/data/caching';
import { prisma } from '@/lib/db/prisma';
import { updateMarketingEmailsSchema } from '@/schemas/account/update-marketing-email-settings';

export const updateMarketingEmails = authActionClient
  .metadata({ actionName: 'updateMarketingEmails' })
  .schema(updateMarketingEmailsSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        enabledNewsletter: parsedInput.enabledNewsletter,
        enabledProductUpdates: parsedInput.enabledProductUpdates
      },
      select: {
        id: true // SELECT NONE
      }
    });

    revalidateTag(
      Caching.createUserTag(UserCacheKey.MarketingEmails, session.user.id)
    );
  });

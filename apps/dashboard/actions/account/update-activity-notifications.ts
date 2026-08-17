'use server';

import { revalidateTag } from 'next/cache';

import { authActionClient } from '@/actions/safe-action';
import { Caching, UserCacheKey } from '@/data/caching';
import { prisma } from '@/lib/db/prisma';
import { updateActivityNotificationsSchema } from '@/schemas/account/update-activity-notifications-schema';

export const updateActivityNotifications = authActionClient
  .metadata({ actionName: 'updateActivityNotifications' })
  .schema(updateActivityNotificationsSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        notificationPreferences: parsedInput
      },
      select: {
        id: true
      }
    });

    revalidateTag(
      Caching.createUserTag(
        UserCacheKey.ActivityNotifications,
        session.user.id
      ),
      'max'
    );
  });

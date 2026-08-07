import 'server-only';

import { unstable_cache as cache } from 'next/cache';
import { redirect } from 'next/navigation';

import {
  Caching,
  defaultRevalidateTimeInSeconds,
  UserCacheKey
} from '@/data/caching';
import { getMailTags } from '@/data/inbox/get-mail-threads';
import { dedupedAuth } from '@/lib/auth';
import { getLoginRedirect } from '@/lib/auth/redirect';
import { checkSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { isOssDeployment } from '@/lib/deployment-mode';
import { parseActivityNotificationPreferences } from '@/lib/notifications/activity-notification-preferences';
import { NotFoundError } from '@/lib/validation/exceptions';
import type {
  ActivityNotificationMailTagOption,
  ActivityNotificationsDto
} from '@/types/dtos/activity-notifications-dto';

export type ActivityNotificationsSettings = {
  settings: ActivityNotificationsDto;
  mailTags: ActivityNotificationMailTagOption[];
};

export async function getActivityNotifications(): Promise<ActivityNotificationsSettings> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    return redirect(getLoginRedirect());
  }

  const oss = isOssDeployment();
  const [settings, mailTags] = await Promise.all([
    cache(
      async () => {
        const userFromDb = await prisma.user.findFirst({
          where: { id: session.user.id },
          select: {
            notificationPreferences: true
          }
        });
        if (!userFromDb) {
          throw new NotFoundError('User not found');
        }

        return parseActivityNotificationPreferences(
          userFromDb.notificationPreferences
        );
      },
      Caching.createUserKeyParts(
        UserCacheKey.ActivityNotifications,
        session.user.id
      ),
      {
        revalidate: defaultRevalidateTimeInSeconds,
        tags: [
          Caching.createUserTag(
            UserCacheKey.ActivityNotifications,
            session.user.id
          )
        ]
      }
    )(),
    oss ? Promise.resolve([]) : getMailTags()
  ]);

  return {
    settings,
    mailTags: mailTags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      color: tag.color
    }))
  };
}

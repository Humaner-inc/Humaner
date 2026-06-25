import 'server-only';

import { unstable_cache as cache } from 'next/cache';
import { redirect } from 'next/navigation';

import {
  Caching,
  defaultRevalidateTimeInSeconds,
  UserCacheKey
} from '@/data/caching';
import { dedupedAuth } from '@/lib/auth';
import { getLoginRedirect } from '@/lib/auth/redirect';
import { checkSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { NotFoundError } from '@/lib/validation/exceptions';
import type { TransactionalEmailsDto } from '@/types/dtos/transactional-emails-dto';

export async function getTransactionalEmails(): Promise<TransactionalEmailsDto> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    return redirect(getLoginRedirect());
  }

  return cache(
    async () => {
      const userFromDb = await prisma.user.findFirst({
        where: { id: session.user.id },
        select: {
          enabledContactsNotifications: true,
          enabledInboxNotifications: true,
          enabledWeeklySummary: true
        }
      });
      if (!userFromDb) {
        throw new NotFoundError('User not found');
      }

      const response: TransactionalEmailsDto = {
        enabledContactsNotifications: userFromDb.enabledContactsNotifications,
        enabledInboxNotifications: userFromDb.enabledInboxNotifications,
        enabledWeeklySummary: userFromDb.enabledWeeklySummary
      };

      return response;
    },
    Caching.createUserKeyParts(
      UserCacheKey.TransactionalEmails,
      session.user.id
    ),
    {
      revalidate: defaultRevalidateTimeInSeconds,
      tags: [
        Caching.createUserTag(UserCacheKey.TransactionalEmails, session.user.id)
      ]
    }
  )();
}

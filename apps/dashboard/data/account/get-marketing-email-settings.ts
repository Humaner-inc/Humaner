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
import type { MarketingEmailsDto } from '@/types/dtos/marketing-emails-dto';

export async function getMarketingEmailSettings(): Promise<MarketingEmailsDto> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    return redirect(getLoginRedirect());
  }

  return cache(
    async () => {
      const userFromDb = await prisma.user.findFirst({
        where: { id: session.user.id },
        select: {
          enabledNewsletter: true,
          enabledProductUpdates: true
        }
      });
      if (!userFromDb) {
        throw new NotFoundError('User not found');
      }

      const response: MarketingEmailsDto = {
        enabledNewsletter: userFromDb.enabledNewsletter,
        enabledProductUpdates: userFromDb.enabledProductUpdates
      };

      return response;
    },
    Caching.createUserKeyParts(UserCacheKey.MarketingEmails, session.user.id),
    {
      revalidate: defaultRevalidateTimeInSeconds,
      tags: [
        Caching.createUserTag(UserCacheKey.MarketingEmails, session.user.id)
      ]
    }
  )();
}

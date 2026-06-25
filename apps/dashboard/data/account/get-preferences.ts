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
import type { PreferencesDto } from '@/types/dtos/preferences-dto';

export async function getPreferences(): Promise<PreferencesDto> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    return redirect(getLoginRedirect());
  }

  return cache(
    async () => {
      const userFromDb = await prisma.user.findFirst({
        where: { id: session.user.id },
        select: {
          locale: true
        }
      });
      if (!userFromDb) {
        throw new NotFoundError('User not found');
      }

      const response: PreferencesDto = {
        locale: userFromDb.locale
      };

      return response;
    },
    Caching.createUserKeyParts(UserCacheKey.Preferences, session.user.id),
    {
      revalidate: defaultRevalidateTimeInSeconds,
      tags: [Caching.createUserTag(UserCacheKey.Preferences, session.user.id)]
    }
  )();
}

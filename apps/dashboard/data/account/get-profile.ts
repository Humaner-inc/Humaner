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
import type { ProfileDto } from '@/types/dtos/profile-dto';

export async function getProfile(): Promise<ProfileDto> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    return redirect(getLoginRedirect());
  }

  return cache(
    async () => {
      const userFromDb = await prisma.user.findFirst({
        where: { id: session.user.id },
        select: {
          id: true,
          image: true,
          name: true,
          email: true,
          role: true,
          locale: true
        }
      });
      if (!userFromDb) {
        throw new NotFoundError('User not found');
      }

      const response: ProfileDto = {
        id: userFromDb.id,
        image: userFromDb.image ?? undefined,
        name: userFromDb.name,
        email: userFromDb.email ?? undefined,
        role: userFromDb.role,
        locale: userFromDb.locale
      };

      return response;
    },
    Caching.createUserKeyParts(UserCacheKey.Profile, session.user.id),
    {
      revalidate: defaultRevalidateTimeInSeconds,
      tags: [
        Caching.createUserTag(UserCacheKey.Profile, session.user.id),
        Caching.createUserTag(UserCacheKey.PersonalDetails, session.user.id),
        Caching.createUserTag(UserCacheKey.Preferences, session.user.id)
      ]
    }
  )();
}

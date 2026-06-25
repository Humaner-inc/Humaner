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
import type { PersonalDetailsDto } from '@/types/dtos/personal-details-dto';

export async function getPersonalDetails(): Promise<PersonalDetailsDto> {
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
          phone: true,
          email: true,
          role: true
        }
      });
      if (!userFromDb) {
        throw new NotFoundError('User not found');
      }

      const response: PersonalDetailsDto = {
        id: userFromDb.id,
        image: userFromDb.image ?? undefined,
        name: userFromDb.name,
        phone: userFromDb.phone ?? undefined,
        email: userFromDb.email ?? undefined
      };

      return response;
    },
    Caching.createUserKeyParts(UserCacheKey.PersonalDetails, session.user.id),
    {
      revalidate: defaultRevalidateTimeInSeconds,
      tags: [
        Caching.createUserTag(UserCacheKey.PersonalDetails, session.user.id)
      ]
    }
  )();
}

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
import type { FavoriteDto } from '@/types/dtos/favorite-dto';
import { SortDirection } from '@/types/sorty-direction';

export async function getFavorites(): Promise<FavoriteDto[]> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    return redirect(getLoginRedirect());
  }

  return cache(
    async () => {
      const favorites = await prisma.favorite.findMany({
        where: { userId: session.user.id },
        select: {
          id: true,
          order: true,
          contact: {
            select: {
              id: true,
              name: true,
              record: true,
              image: true
            }
          }
        },
        orderBy: {
          order: SortDirection.Asc
        }
      });

      const mapped: FavoriteDto[] = favorites.map((favorite) => ({
        id: favorite.id,
        order: favorite.order,
        contactId: favorite.contact.id,
        name: favorite.contact.name,
        record: favorite.contact.record,
        image: favorite.contact.image ? favorite.contact.image : undefined
      }));

      return mapped;
    },
    Caching.createUserKeyParts(UserCacheKey.Favorites, session.user.id),
    {
      revalidate: defaultRevalidateTimeInSeconds,
      tags: [Caching.createUserTag(UserCacheKey.Favorites, session.user.id)]
    }
  )();
}

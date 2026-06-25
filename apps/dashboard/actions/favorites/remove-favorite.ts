'use server';

import { revalidateTag } from 'next/cache';

import { authActionClient } from '@/actions/safe-action';
import { Caching, UserCacheKey } from '@/data/caching';
import { prisma } from '@/lib/db/prisma';
import { updateFavoritesOrder } from '@/lib/db/update-favorites-order';
import { removeFavoriteSchema } from '@/schemas/favorites/remove-favorite-schema';

export const removeFavorite = authActionClient
  .metadata({ actionName: 'removeFavorite' })
  .schema(removeFavoriteSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    await prisma.$transaction([
      prisma.favorite.deleteMany({
        where: {
          userId: session.user.id,
          contactId: parsedInput.contactId
        }
      }),
      updateFavoritesOrder(session.user.id)
    ]);

    revalidateTag(
      Caching.createUserTag(UserCacheKey.Favorites, session.user.id)
    );

    revalidateTag(
      Caching.createUserTag(
        UserCacheKey.ContactIsInFavorites,
        session.user.id,
        parsedInput.contactId
      )
    );
  });

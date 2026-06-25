'use server';

import { revalidateTag } from 'next/cache';

import { authActionClient } from '@/actions/safe-action';
import { Caching, UserCacheKey } from '@/data/caching';
import { prisma } from '@/lib/db/prisma';
import { updateFavoritesOrder } from '@/lib/db/update-favorites-order';
import { addFavoriteSchema } from '@/schemas/favorites/add-favorite-schema';

export const addFavorite = authActionClient
  .metadata({ actionName: 'addFavorite' })
  .schema(addFavoriteSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const count = await prisma.favorite.count({
      where: {
        userId: session.user.id,
        contactId: parsedInput.contactId
      }
    });

    // already added
    if (count > 0) {
      return;
    }

    await prisma.$transaction([
      prisma.favorite.deleteMany({
        where: {
          userId: session.user.id,
          contactId: parsedInput.contactId
        }
      }),
      prisma.favorite.create({
        data: {
          userId: session.user.id,
          contactId: parsedInput.contactId,
          order: await prisma.favorite.count({
            where: { userId: session.user.id }
          })
        },
        select: {
          id: true // SELECT NONE
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

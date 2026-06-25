'use server';

import { revalidateTag } from 'next/cache';
import { type Prisma } from '@prisma/client';

import { authActionClient } from '@/actions/safe-action';
import { Caching, UserCacheKey } from '@/data/caching';
import { prisma } from '@/lib/db/prisma';
import { updateFavoritesOrder } from '@/lib/db/update-favorites-order';
import { reorderFavoritesSchema } from '@/schemas/favorites/reorder-favorites-schema';

export const reorderFavorites = authActionClient
  .metadata({ actionName: 'reorderFavorites' })
  .schema(reorderFavoritesSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const favorites = await prisma.favorite.findMany({
      where: {
        userId: session.user.id
      },
      select: {
        id: true
      }
    });

    const updates: Prisma.PrismaPromise<unknown>[] = [];
    for (const favorite of parsedInput.favorites) {
      if (favorites.some((f) => f.id === favorite.id)) {
        updates.push(
          prisma.favorite.update({
            where: { id: favorite.id },
            data: { order: favorite.order }
          })
        );
      }
    }

    if (updates.length > 0) {
      await prisma.$transaction([
        ...updates,
        updateFavoritesOrder(session.user.id)
      ]);

      revalidateTag(
        Caching.createUserTag(UserCacheKey.Favorites, session.user.id)
      );
    }
  });

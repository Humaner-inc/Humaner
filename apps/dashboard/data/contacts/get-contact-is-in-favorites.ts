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
import { ValidationError } from '@/lib/validation/exceptions';
import {
  getContactIsInFavoritesSchema,
  type GetContactAddedToFavoritesSchema
} from '@/schemas/contacts/get-contact-is-in-favorites-schema';

export async function getContactIsInFavorites(
  input: GetContactAddedToFavoritesSchema
): Promise<boolean> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    return redirect(getLoginRedirect());
  }

  const result = getContactIsInFavoritesSchema.safeParse(input);
  if (!result.success) {
    throw new ValidationError(JSON.stringify(result.error.flatten()));
  }
  const parsedInput = result.data;

  return cache(
    async () => {
      const count = await prisma.favorite.count({
        where: {
          userId: session.user.id,
          contactId: parsedInput.contactId
        }
      });

      return count > 0;
    },
    Caching.createUserKeyParts(
      UserCacheKey.ContactIsInFavorites,
      session.user.id,
      parsedInput.contactId
    ),
    {
      revalidate: defaultRevalidateTimeInSeconds,
      tags: [
        Caching.createUserTag(
          UserCacheKey.ContactIsInFavorites,
          session.user.id,
          parsedInput.contactId
        ),
        Caching.createUserTag(UserCacheKey.Favorites, session.user.id)
      ]
    }
  )();
}

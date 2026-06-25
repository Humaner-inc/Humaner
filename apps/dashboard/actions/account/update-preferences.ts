'use server';

import { revalidateTag } from 'next/cache';

import { authActionClient } from '@/actions/safe-action';
import { Caching, OrganizationCacheKey, UserCacheKey } from '@/data/caching';
import { prisma } from '@/lib/db/prisma';
import { updatePreferencesSchema } from '@/schemas/account/update-preferences-schema';

export const updatePreferences = authActionClient
  .metadata({ actionName: 'updatePreferences' })
  .schema(updatePreferencesSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        locale: parsedInput.locale
      },
      select: {
        id: true // SELECT NONE
      }
    });

    revalidateTag(
      Caching.createUserTag(UserCacheKey.Preferences, session.user.id)
    );
    revalidateTag(
      Caching.createOrganizationTag(
        OrganizationCacheKey.Members,
        session.user.organizationId
      )
    );
  });

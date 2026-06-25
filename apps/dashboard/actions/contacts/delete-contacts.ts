'use server';

import { revalidateTag } from 'next/cache';

import { authActionClient } from '@/actions/safe-action';
import { Caching, OrganizationCacheKey, UserCacheKey } from '@/data/caching';
import { prisma } from '@/lib/db/prisma';
import { deleteContactsSchema } from '@/schemas/contacts/delete-contacts-schema';

export const deleteContacts = authActionClient
  .metadata({ actionName: 'deleteContacts' })
  .schema(deleteContactsSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    await prisma.contact.deleteMany({
      where: {
        id: {
          in: parsedInput.ids
        },
        organizationId: session.user.organizationId
      }
    });

    revalidateTag(
      Caching.createOrganizationTag(
        OrganizationCacheKey.Contacts,
        session.user.organizationId
      )
    );

    for (const id of parsedInput.ids) {
      revalidateTag(
        Caching.createOrganizationTag(
          OrganizationCacheKey.Contact,
          session.user.organizationId,
          id
        )
      );
    }

    revalidateTag(
      Caching.createUserTag(UserCacheKey.Favorites, session.user.id)
    );
  });

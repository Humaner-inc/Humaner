'use server';

import { revalidateTag } from 'next/cache';

import { authActionClient } from '@/actions/safe-action';
import { Caching, OrganizationCacheKey, UserCacheKey } from '@/data/caching';
import { createContactAndCaptureEvent } from '@/lib/db/contact-event-capture';
import { addContactSchema } from '@/schemas/contacts/add-contact-schema';

export const addContact = authActionClient
  .metadata({ actionName: 'addContact' })
  .schema(addContactSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    await createContactAndCaptureEvent(
      {
        record: parsedInput.record,
        name: parsedInput.name,
        email: parsedInput.email,
        phone: parsedInput.phone,
        organization: {
          connect: {
            id: session.user.organizationId
          }
        }
      },
      session.user.id
    );

    revalidateTag(
      Caching.createOrganizationTag(
        OrganizationCacheKey.Contacts,
        session.user.organizationId
      )
    );

    revalidateTag(
      Caching.createUserTag(UserCacheKey.Favorites, session.user.id)
    );
  });

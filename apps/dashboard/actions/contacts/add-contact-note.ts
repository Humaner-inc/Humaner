'use server';

import { revalidateTag } from 'next/cache';

import { authActionClient } from '@/actions/safe-action';
import { Caching, OrganizationCacheKey } from '@/data/caching';
import { prisma } from '@/lib/db/prisma';
import { addContactNoteSchema } from '@/schemas/contacts/add-contact-note-schema';

export const addContactNote = authActionClient
  .metadata({ actionName: 'addContactNote' })
  .schema(addContactNoteSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    await prisma.contactNote.create({
      data: {
        contactId: parsedInput.contactId,
        text: parsedInput.text ? parsedInput.text : undefined,
        userId: session.user.id
      },
      select: {
        id: true // SELECT NONE
      }
    });

    revalidateTag(
      Caching.createOrganizationTag(
        OrganizationCacheKey.ContactNotes,
        session.user.organizationId,
        parsedInput.contactId
      )
    );
  });

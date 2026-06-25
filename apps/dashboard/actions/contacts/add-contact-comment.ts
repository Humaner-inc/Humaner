'use server';

import { revalidateTag } from 'next/cache';

import { authActionClient } from '@/actions/safe-action';
import { Caching, OrganizationCacheKey } from '@/data/caching';
import { prisma } from '@/lib/db/prisma';
import { addContactCommentSchema } from '@/schemas/contacts/add-contact-comment-schema';

export const addContactComment = authActionClient
  .metadata({ actionName: 'addContactComment' })
  .schema(addContactCommentSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    await prisma.contactComment.create({
      data: {
        contactId: parsedInput.contactId,
        text: parsedInput.text,
        userId: session.user.id
      },
      select: {
        id: true // SELECT NONE
      }
    });

    revalidateTag(
      Caching.createOrganizationTag(
        OrganizationCacheKey.ContactTimelineEvents,
        session.user.organizationId,
        parsedInput.contactId
      )
    );
  });

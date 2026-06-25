'use server';

import { revalidateTag } from 'next/cache';

import { authActionClient } from '@/actions/safe-action';
import { Caching, OrganizationCacheKey } from '@/data/caching';
import { prisma } from '@/lib/db/prisma';
import { NotFoundError } from '@/lib/validation/exceptions';
import { updateContactCommentSchema } from '@/schemas/contacts/update-contact-comment-schema';

export const updateContactComment = authActionClient
  .metadata({ actionName: 'updateContactComment' })
  .schema(updateContactCommentSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const count = await prisma.contactComment.count({
      where: {
        id: parsedInput.id,
        contact: {
          organizationId: session.user.organizationId
        }
      }
    });
    if (count < 1) {
      throw new NotFoundError('Contact comment not found');
    }

    const comment = await prisma.contactComment.update({
      where: { id: parsedInput.id },
      data: { text: parsedInput.text },
      select: { contactId: true }
    });

    revalidateTag(
      Caching.createOrganizationTag(
        OrganizationCacheKey.ContactTimelineEvents,
        session.user.organizationId,
        comment.contactId
      )
    );
  });

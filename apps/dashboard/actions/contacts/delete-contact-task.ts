'use server';

import { revalidateTag } from 'next/cache';

import { authActionClient } from '@/actions/safe-action';
import { Caching, OrganizationCacheKey } from '@/data/caching';
import { prisma } from '@/lib/db/prisma';
import { NotFoundError } from '@/lib/validation/exceptions';
import { deleteContactTaskSchema } from '@/schemas/contacts/delete-contact-task-schema';

export const deleteContactTask = authActionClient
  .metadata({ actionName: 'deleteContactTask' })
  .schema(deleteContactTaskSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const count = await prisma.contactTask.count({
      where: {
        id: parsedInput.id,
        contact: {
          organizationId: session.user.organizationId
        }
      }
    });
    if (count < 1) {
      throw new NotFoundError('Task not found');
    }

    const deletedTask = await prisma.contactTask.delete({
      where: { id: parsedInput.id },
      select: { contactId: true }
    });

    revalidateTag(
      Caching.createOrganizationTag(
        OrganizationCacheKey.ContactTasks,
        session.user.organizationId,
        deletedTask.contactId
      )
    );
  });

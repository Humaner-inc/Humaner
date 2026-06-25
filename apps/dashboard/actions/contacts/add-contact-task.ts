'use server';

import { revalidateTag } from 'next/cache';

import { authActionClient } from '@/actions/safe-action';
import { Caching, OrganizationCacheKey } from '@/data/caching';
import { prisma } from '@/lib/db/prisma';
import { NotFoundError } from '@/lib/validation/exceptions';
import { addContactTaskSchema } from '@/schemas/contacts/add-contact-task-schema';

export const addContactTask = authActionClient
  .metadata({ actionName: 'addContactTask' })
  .schema(addContactTaskSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const count = await prisma.contact.count({
      where: {
        id: parsedInput.contactId,
        organizationId: session.user.organizationId
      }
    });
    if (count < 1) {
      throw new NotFoundError('Contact not found.');
    }

    await prisma.contactTask.create({
      data: {
        contactId: parsedInput.contactId,
        title: parsedInput.title,
        description: parsedInput.description,
        status: parsedInput.status,
        dueDate: parsedInput.dueDate ? parsedInput.dueDate : null
      },
      select: {
        id: true // SELECT NONE
      }
    });

    revalidateTag(
      Caching.createOrganizationTag(
        OrganizationCacheKey.ContactTasks,
        session.user.organizationId,
        parsedInput.contactId
      )
    );
  });

'use server';

import { revalidateTag } from 'next/cache';

import { authActionClient } from '@/actions/safe-action';
import { Caching, OrganizationCacheKey } from '@/data/caching';
import { assertContactInOrganization } from '@/lib/db/assert-ownership';
import { prisma } from '@/lib/db/prisma';
import { addContactTaskSchema } from '@/schemas/contacts/add-contact-task-schema';

export const addContactTask = authActionClient
  .metadata({ actionName: 'addContactTask' })
  .schema(addContactTaskSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    await assertContactInOrganization(
      parsedInput.contactId,
      session.user.organizationId
    );

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
      ),
      'max'
    );
  });

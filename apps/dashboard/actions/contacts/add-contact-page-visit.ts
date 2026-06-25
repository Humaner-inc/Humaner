'use server';

import { revalidateTag } from 'next/cache';

import { authActionClient } from '@/actions/safe-action';
import { Caching, OrganizationCacheKey } from '@/data/caching';
import { prisma } from '@/lib/db/prisma';
import { NotFoundError } from '@/lib/validation/exceptions';
import { addContactPageVisitSchema } from '@/schemas/contacts/add-contact-page-visit-schema';

export const addContactPageVisit = authActionClient
  .metadata({ actionName: 'addContactPageVisit' })
  .schema(addContactPageVisitSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const countContacts = await prisma.contact.count({
      where: {
        organizationId: session.user.organizationId,
        id: parsedInput.contactId
      }
    });
    if (countContacts < 1) {
      throw new NotFoundError('Contact not found');
    }

    await prisma.contactPageVisit.create({
      data: {
        contactId: parsedInput.contactId,
        userId: session.user.id
      },
      select: {
        id: true // SELECT NONE
      }
    });

    revalidateTag(
      Caching.createOrganizationTag(
        OrganizationCacheKey.ContactPageVisits,
        session.user.organizationId
      )
    );
  });

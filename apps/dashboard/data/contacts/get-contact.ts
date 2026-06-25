import 'server-only';

import { unstable_cache as cache } from 'next/cache';
import { notFound, redirect } from 'next/navigation';

import {
  Caching,
  defaultRevalidateTimeInSeconds,
  OrganizationCacheKey
} from '@/data/caching';
import { dedupedAuth } from '@/lib/auth';
import { getLoginRedirect } from '@/lib/auth/redirect';
import { checkSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { ValidationError } from '@/lib/validation/exceptions';
import {
  getContactSchema,
  type GetContactSchema
} from '@/schemas/contacts/get-contact-schema';
import type { ContactDto } from '@/types/dtos/contact-dto';

export async function getContact(input: GetContactSchema): Promise<ContactDto> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    return redirect(getLoginRedirect());
  }

  const result = getContactSchema.safeParse(input);
  if (!result.success) {
    throw new ValidationError(JSON.stringify(result.error.flatten()));
  }
  const parsedInput = result.data;

  return cache(
    async () => {
      const contact = await prisma.contact.findFirst({
        where: {
          organizationId: session.user.organizationId,
          id: parsedInput.id
        },
        select: {
          id: true,
          record: true,
          image: true,
          name: true,
          email: true,
          address: true,
          phone: true,
          stage: true,
          createdAt: true,
          tags: {
            select: {
              id: true,
              text: true
            }
          }
        }
      });
      if (!contact) {
        return notFound();
      }

      const response: ContactDto = {
        id: contact.id,
        record: contact.record,
        image: contact.image ? contact.image : undefined,
        name: contact.name,
        email: contact.email ? contact.email : undefined,
        address: contact.address ? contact.address : undefined,
        phone: contact.phone ? contact.phone : undefined,
        stage: contact.stage,
        createdAt: contact.createdAt,
        tags: contact.tags
      };

      return response;
    },
    Caching.createOrganizationKeyParts(
      OrganizationCacheKey.Contact,
      session.user.organizationId,
      parsedInput.id
    ),
    {
      revalidate: defaultRevalidateTimeInSeconds,
      tags: [
        Caching.createOrganizationTag(
          OrganizationCacheKey.Contact,
          session.user.organizationId,
          parsedInput.id
        )
      ]
    }
  )();
}

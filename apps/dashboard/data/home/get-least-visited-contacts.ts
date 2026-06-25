import 'server-only';

import { unstable_cache as cache } from 'next/cache';
import { redirect } from 'next/navigation';
import { Prisma } from '@prisma/client';
import { endOfDay, startOfDay } from 'date-fns';

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
  getLeastVisitedContactsSchema,
  type GetLeastVisitedContactsSchema
} from '@/schemas/home/get-least-vistied-contacts-schema';
import type { VisitedContactDto } from '@/types/dtos/visited-contact-dto';
import { SortDirection } from '@/types/sorty-direction';

export async function getLeastVisitedContacts(
  input: GetLeastVisitedContactsSchema
): Promise<VisitedContactDto[]> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    return redirect(getLoginRedirect());
  }

  const result = getLeastVisitedContactsSchema.safeParse(input);
  if (!result.success) {
    throw new ValidationError(JSON.stringify(result.error.flatten()));
  }
  const parsedInput = result.data;

  return cache(
    async () => {
      const [contacts] = await prisma.$transaction(
        [
          prisma.contact.findMany({
            where: { organizationId: session.user.organizationId },
            select: {
              id: true,
              name: true,
              image: true,
              record: true,
              _count: {
                select: {
                  pageVisits: {
                    where: {
                      timestamp: {
                        gte: startOfDay(parsedInput.from),
                        lte: endOfDay(parsedInput.to)
                      }
                    }
                  }
                }
              }
            },
            orderBy: {
              pageVisits: {
                _count: SortDirection.Asc
              }
            },
            take: 6
          })
        ],
        {
          isolationLevel: Prisma.TransactionIsolationLevel.ReadUncommitted
        }
      );

      const response: VisitedContactDto[] = contacts.map((contact) => ({
        id: contact.id,
        name: contact.name,
        image: contact.image ?? undefined,
        record: contact.record,
        pageVisits: contact._count.pageVisits
      }));

      return response;
    },
    Caching.createOrganizationKeyParts(
      OrganizationCacheKey.ContactPageVisits,
      session.user.organizationId,
      parsedInput.from.toISOString(),
      parsedInput.to.toISOString()
    ),
    {
      revalidate: defaultRevalidateTimeInSeconds,
      tags: [
        Caching.createOrganizationTag(
          OrganizationCacheKey.ContactPageVisits,
          session.user.organizationId
        ),
        Caching.createOrganizationTag(
          OrganizationCacheKey.Contacts,
          session.user.organizationId
        )
      ]
    }
  )();
}

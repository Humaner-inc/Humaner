import 'server-only';

import { unstable_cache as cache } from 'next/cache';
import { redirect } from 'next/navigation';
import { ContactRecord, Prisma } from '@prisma/client';

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
  getContactsSchema,
  RecordsOption,
  type GetContactsSchema
} from '@/schemas/contacts/get-contacts-schema';
import type { ContactDto } from '@/types/dtos/contact-dto';

export async function getContacts(
  input: GetContactsSchema
): Promise<{ contacts: ContactDto[]; totalCount: number }> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    return redirect(getLoginRedirect());
  }

  const result = getContactsSchema.safeParse(input);
  if (!result.success) {
    throw new ValidationError(JSON.stringify(result.error.flatten()));
  }
  const parsedInput = result.data;

  const searchCriteria: Prisma.StringFilter | undefined =
    parsedInput.searchQuery
      ? { contains: parsedInput.searchQuery, mode: 'insensitive' }
      : undefined;
  const searchVector = searchCriteria
    ? [{ name: searchCriteria }, { email: searchCriteria }]
    : undefined;

  return cache(
    async () => {
      const [contacts, totalCount] = await prisma.$transaction([
        prisma.contact.findMany({
          skip: parsedInput.pageIndex * parsedInput.pageSize,
          take: parsedInput.pageSize,
          where: {
            organizationId: session.user.organizationId,
            record: mapRecords(parsedInput.records),
            tags:
              parsedInput.tags && parsedInput.tags.length > 0
                ? { some: { text: { in: parsedInput.tags } } }
                : undefined,
            OR: searchVector
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
          },
          orderBy: {
            [parsedInput.sortBy]: parsedInput.sortDirection
          }
        }),
        prisma.contact.count({
          where: { organizationId: session.user.organizationId }
        })
      ]);

      const mapped: ContactDto[] = contacts.map((contact) => ({
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
      }));

      return { contacts: mapped, totalCount };
    },
    Caching.createOrganizationKeyParts(
      OrganizationCacheKey.Contacts,
      session.user.organizationId,
      parsedInput.pageIndex.toString(),
      parsedInput.pageSize.toString(),
      parsedInput.sortBy,
      parsedInput.sortDirection,
      parsedInput.tags.join(','),
      parsedInput.records?.toString() ?? '',
      parsedInput.searchQuery?.toString() ?? ''
    ),
    {
      revalidate: defaultRevalidateTimeInSeconds,
      tags: [
        Caching.createOrganizationTag(
          OrganizationCacheKey.Contacts,
          session.user.organizationId
        )
      ]
    }
  )();
}

function mapRecords(option: RecordsOption): ContactRecord | undefined {
  switch (option) {
    case RecordsOption.People:
      return ContactRecord.PERSON;
    case RecordsOption.Companies:
      return ContactRecord.COMPANY;
  }

  return undefined;
}

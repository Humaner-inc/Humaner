import 'server-only';

import { unstable_cache as cache } from 'next/cache';
import { redirect } from 'next/navigation';
import { Prisma } from '@prisma/client';

import {
  Caching,
  defaultRevalidateTimeInSeconds,
  OrganizationCacheKey
} from '@/data/caching';
import { dedupedAuth } from '@/lib/auth';
import { getLoginRedirect } from '@/lib/auth/redirect';
import { checkSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import type { TagDto } from '@/types/dtos/tag-dto';
import { SortDirection } from '@/types/sorty-direction';

export async function getContactTags(): Promise<TagDto[]> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    return redirect(getLoginRedirect());
  }

  return cache(
    async () => {
      const [contactTags] = await prisma.$transaction(
        [
          prisma.contactTag.findMany({
            where: {
              contacts: {
                some: {
                  organizationId: session.user.organizationId
                }
              }
            },
            select: {
              id: true,
              text: true
            },
            orderBy: {
              text: SortDirection.Asc
            }
          })
        ],
        {
          isolationLevel: Prisma.TransactionIsolationLevel.ReadUncommitted
        }
      );

      return contactTags;
    },
    Caching.createOrganizationKeyParts(
      OrganizationCacheKey.ContactTags,
      session.user.organizationId
    ),
    {
      revalidate: defaultRevalidateTimeInSeconds,
      tags: [
        Caching.createOrganizationTag(
          OrganizationCacheKey.ContactTags,
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

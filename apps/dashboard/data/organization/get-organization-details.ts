import 'server-only';

import { unstable_cache as cache } from 'next/cache';
import { redirect } from 'next/navigation';

import {
  Caching,
  defaultRevalidateTimeInSeconds,
  OrganizationCacheKey
} from '@/data/caching';
import { dedupedAuth } from '@/lib/auth';
import { getLoginRedirect } from '@/lib/auth/redirect';
import { checkSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { NotFoundError } from '@/lib/validation/exceptions';
import type { OrganizationDetailsDto } from '@/types/dtos/organization-details-dto';

export async function getOrganizationDetails(): Promise<OrganizationDetailsDto> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    return redirect(getLoginRedirect());
  }

  return cache(
    async () => {
      const organization = await prisma.organization.findFirst({
        where: { id: session.user.organizationId },
        select: {
          name: true,
          address: true,
          phone: true,
          email: true,
          website: true
        }
      });
      if (!organization) {
        throw new NotFoundError('Organization not found');
      }

      const response: OrganizationDetailsDto = {
        name: organization.name,
        address: organization.address ? organization.address : undefined,
        phone: organization.phone ? organization.phone : undefined,
        email: organization.email ? organization.email : undefined,
        website: organization.website ? organization.website : undefined
      };

      return response;
    },
    Caching.createOrganizationKeyParts(
      OrganizationCacheKey.OrganizationDetails,
      session.user.organizationId
    ),
    {
      revalidate: defaultRevalidateTimeInSeconds,
      tags: [
        Caching.createOrganizationTag(
          OrganizationCacheKey.OrganizationDetails,
          session.user.organizationId
        )
      ]
    }
  )();
}

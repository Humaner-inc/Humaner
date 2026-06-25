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
import type { SocialMediaDto } from '@/types/dtos/social-media-dto';

export async function getSocialMedia(): Promise<SocialMediaDto> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    return redirect(getLoginRedirect());
  }

  return cache(
    async () => {
      const organization = await prisma.organization.findFirst({
        where: { id: session.user.organizationId },
        select: {
          linkedInProfile: true,
          youTubeChannel: true,
          instagramProfile: true,
          xProfile: true,
          tikTokProfile: true,
          facebookPage: true
        }
      });
      if (!organization) {
        throw new NotFoundError('Organization not found');
      }

      const response: SocialMediaDto = {
        linkedInProfile: organization.linkedInProfile
          ? organization.linkedInProfile
          : undefined,
        instagramProfile: organization.instagramProfile
          ? organization.instagramProfile
          : undefined,
        youTubeChannel: organization.youTubeChannel
          ? organization.youTubeChannel
          : undefined,
        xProfile: organization.xProfile ? organization.xProfile : undefined,
        tikTokProfile: organization.tikTokProfile
          ? organization.tikTokProfile
          : undefined,
        facebookPage: organization.facebookPage
          ? organization.facebookPage
          : undefined
      };

      return response;
    },
    Caching.createOrganizationKeyParts(
      OrganizationCacheKey.SocialMedia,
      session.user.organizationId
    ),
    {
      revalidate: defaultRevalidateTimeInSeconds,
      tags: [
        Caching.createOrganizationTag(
          OrganizationCacheKey.SocialMedia,
          session.user.organizationId
        )
      ]
    }
  )();
}

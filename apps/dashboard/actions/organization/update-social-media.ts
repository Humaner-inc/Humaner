'use server';

import { revalidateTag } from 'next/cache';

import { authActionClient } from '@/actions/safe-action';
import { Caching, OrganizationCacheKey } from '@/data/caching';
import { prisma } from '@/lib/db/prisma';
import { NotFoundError } from '@/lib/validation/exceptions';
import { updateSocialMediaSchema } from '@/schemas/organization/update-social-media-schema';

export const updateSocialMedia = authActionClient
  .metadata({ actionName: 'updateSocialMedia' })
  .schema(updateSocialMediaSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const count = await prisma.organization.count({
      where: { id: session.user.organizationId }
    });
    if (count < 1) {
      throw new NotFoundError('Organization not found');
    }

    await prisma.organization.update({
      where: { id: session.user.organizationId },
      data: {
        linkedInProfile: parsedInput.linkedInProfile,
        instagramProfile: parsedInput.instagramProfile,
        youTubeChannel: parsedInput.youTubeChannel,
        xProfile: parsedInput.xProfile,
        tikTokProfile: parsedInput.tikTokProfile,
        facebookPage: parsedInput.facebookPage
      },
      select: {
        id: true // SELECT NONE
      }
    });

    revalidateTag(
      Caching.createOrganizationTag(
        OrganizationCacheKey.SocialMedia,
        session.user.organizationId
      )
    );
  });

'use server';

import { revalidateTag } from 'next/cache';

import { authActionClient } from '@/actions/safe-action';
import { Caching, OrganizationCacheKey } from '@/data/caching';
import { prisma } from '@/lib/db/prisma';
import { getIndustry } from '@/lib/industries';
import { NotFoundError } from '@/lib/validation/exceptions';
import { updateOrganizationIndustrySchema } from '@/schemas/organization/update-organization-industry-schema';

export const updateOrganizationIndustry = authActionClient
  .metadata({ actionName: 'updateOrganizationIndustry' })
  .schema(updateOrganizationIndustrySchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const organization = await prisma.organization.findFirst({
      where: { id: session.user.organizationId },
      select: { id: true }
    });
    if (!organization) {
      throw new NotFoundError('Organization not found');
    }

    const preset = getIndustry(parsedInput.industry);

    // Changing the industry re-anchors every agent to the new vertical's
    // defaults — this intentionally overwrites prior persona/style tuning.
    await prisma.$transaction([
      prisma.organization.update({
        where: { id: session.user.organizationId },
        data: { industry: parsedInput.industry },
        select: { id: true }
      }),
      prisma.agent.updateMany({
        where: { organizationId: session.user.organizationId },
        data: {
          industry: parsedInput.industry,
          character: preset.defaultCharacter,
          forbiddenTopics: preset.forbiddenTopics,
          verbosity: 'BALANCED',
          formality: 'STANDARD',
          emojiMode: 'NONE',
          openerStyle: 'DIRECT',
          allowTypos: false
        }
      })
    ]);

    revalidateTag(
      Caching.createOrganizationTag(
        OrganizationCacheKey.Industry,
        session.user.organizationId
      )
    );
    revalidateTag(
      Caching.createOrganizationTag(
        OrganizationCacheKey.Agents,
        session.user.organizationId
      )
    );
  });

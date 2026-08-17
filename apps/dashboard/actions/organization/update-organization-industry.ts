'use server';

import { revalidateTag } from 'next/cache';
import { getVerticalConfig } from '@/services/training/verticals';

import { ownerActionClient } from '@/actions/safe-action';
import { Caching, OrganizationCacheKey } from '@/data/caching';
import { prisma } from '@/lib/db/prisma';
import { NotFoundError } from '@/lib/validation/exceptions';
import { updateOrganizationIndustrySchema } from '@/schemas/organization/update-organization-industry-schema';

export const updateOrganizationIndustry = ownerActionClient
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

    const vertical = getVerticalConfig(parsedInput.industry);
    const persona = vertical.personaPreset;
    const verticalTopics = vertical.commonTopics;

    // Changing the industry re-anchors every agent to the new vertical's
    // defaults — this intentionally overwrites prior persona/style tuning.
    await prisma.$transaction([
      prisma.organization.update({
        where: { id: session.user.organizationId },
        data: {
          industry: parsedInput.industry,
          verticalTopics
        },
        select: { id: true }
      }),
      prisma.agent.updateMany({
        where: { organizationId: session.user.organizationId },
        data: {
          industry: parsedInput.industry,
          character: persona.character,
          forbiddenTopics: vertical.forbiddenTopics,
          trainingTopics: verticalTopics,
          verbosity: persona.verbosity,
          formality: persona.formality,
          emojiMode: persona.emojiMode,
          openerStyle: persona.openerStyle,
          allowTypos: persona.allowTypos
        }
      })
    ]);

    revalidateTag(
      Caching.createOrganizationTag(
        OrganizationCacheKey.Industry,
        session.user.organizationId
      ),
      'max'
    );
    revalidateTag(
      Caching.createOrganizationTag(
        OrganizationCacheKey.Agents,
        session.user.organizationId
      ),
      'max'
    );
  });

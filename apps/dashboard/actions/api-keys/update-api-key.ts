'use server';

import { revalidateTag } from 'next/cache';
import { startOfDay } from 'date-fns';

import { authActionClient } from '@/actions/safe-action';
import { Caching, OrganizationCacheKey } from '@/data/caching';
import { prisma } from '@/lib/db/prisma';
import { NotFoundError } from '@/lib/validation/exceptions';
import { updateApiKeySchema } from '@/schemas/api-keys/update-api-key-schema';

export const updateApiKey = authActionClient
  .metadata({ actionName: 'updateApiKey' })
  .schema(updateApiKeySchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const count = await prisma.apiKey.count({
      where: {
        organizationId: session.user.organizationId,
        id: parsedInput.id
      }
    });
    if (count < 1) {
      throw new NotFoundError('API key not found');
    }

    await prisma.apiKey.update({
      where: { id: parsedInput.id },
      data: {
        description: parsedInput.description,
        expiresAt: parsedInput.neverExpires
          ? null
          : startOfDay(parsedInput.expiresAt ?? new Date())
      },
      select: {
        id: true // SELECT NONE
      }
    });

    revalidateTag(
      Caching.createOrganizationTag(
        OrganizationCacheKey.ApiKeys,
        session.user.organizationId
      )
    );
  });

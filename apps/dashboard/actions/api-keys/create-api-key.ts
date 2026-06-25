'use server';

import { revalidateTag } from 'next/cache';
import { startOfDay } from 'date-fns';

import { authActionClient } from '@/actions/safe-action';
import { Caching, OrganizationCacheKey } from '@/data/caching';
import { generateApiKey, hashApiKey } from '@/lib/auth/api-keys';
import { prisma } from '@/lib/db/prisma';
import { createApiKeySchema } from '@/schemas/api-keys/create-api-key-schema';

export const createApiKey = authActionClient
  .metadata({ actionName: 'createApiKey' })
  .schema(createApiKeySchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const apiKey = generateApiKey();
    await prisma.apiKey.create({
      data: {
        description: parsedInput.description,
        hashedKey: hashApiKey(apiKey),
        expiresAt: parsedInput.neverExpires
          ? null
          : startOfDay(parsedInput.expiresAt ?? new Date()),
        organizationId: session.user.organizationId
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

    return { apiKey };
  });

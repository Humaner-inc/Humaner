'use server';

import { revalidateTag } from 'next/cache';

import { ownerActionClient } from '@/actions/safe-action';
import { Caching, OrganizationCacheKey } from '@/data/caching';
import { recordAuditEvent } from '@/lib/audit/record-audit-event';
import { prisma } from '@/lib/db/prisma';
import { NotFoundError } from '@/lib/validation/exceptions';
import { revokeApiKeySchema } from '@/schemas/api-keys/revoke-api-key-schema';

export const revokeApiKey = ownerActionClient
  .metadata({ actionName: 'revokeApiKey' })
  .schema(revokeApiKeySchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const existing = await prisma.apiKey.findFirst({
      where: {
        organizationId: session.user.organizationId,
        id: parsedInput.id
      },
      select: {
        id: true,
        description: true,
        expiresAt: true
      }
    });
    if (!existing) {
      throw new NotFoundError('API key not found');
    }

    await prisma.apiKey.delete({
      where: { id: parsedInput.id },
      select: {
        id: true // SELECT NONE
      }
    });

    await recordAuditEvent({
      organizationId: session.user.organizationId,
      eventType: 'api_key.deleted',
      actorId: session.user.id,
      actorEmail: session.user.email,
      resourceType: 'api_key',
      resourceId: existing.id,
      before: {
        description: existing.description,
        expiresAt: existing.expiresAt?.toISOString() ?? null
      }
    });

    revalidateTag(
      Caching.createOrganizationTag(
        OrganizationCacheKey.ApiKeys,
        session.user.organizationId
      )
    );
  });

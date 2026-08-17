'use server';

import { revalidateTag } from 'next/cache';

import { ownerActionClient } from '@/actions/safe-action';
import { Caching, OrganizationCacheKey } from '@/data/caching';
import { prisma } from '@/lib/db/prisma';
import { encryptSensitiveField } from '@/lib/security/sensitive-fields';
import { NotFoundError } from '@/lib/validation/exceptions';
import { updateWebhookSchema } from '@/schemas/webhooks/update-webhook-schema';

export const updateWebhook = ownerActionClient
  .metadata({ actionName: 'updateWebhook' })
  .schema(updateWebhookSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const count = await prisma.webhook.count({
      where: {
        organizationId: session.user.organizationId,
        id: parsedInput.id
      }
    });
    if (count < 1) {
      throw new NotFoundError('Webhook not found');
    }

    const nextSecret =
      parsedInput.secret && parsedInput.secret.length > 0
        ? encryptSensitiveField(parsedInput.secret)
        : undefined;

    await prisma.webhook.update({
      where: {
        id: parsedInput.id,
        organizationId: session.user.organizationId
      },
      data: {
        url: parsedInput.url,
        triggers: parsedInput.triggers ? parsedInput.triggers : [],
        ...(nextSecret !== undefined ? { secret: nextSecret } : {})
      },
      select: {
        id: true // SELECT NONE
      }
    });

    revalidateTag(
      Caching.createOrganizationTag(
        OrganizationCacheKey.Webhooks,
        session.user.organizationId
      ),
      'max'
    );
  });

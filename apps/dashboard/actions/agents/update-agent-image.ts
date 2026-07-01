'use server';

import { createHash } from 'crypto';
import { revalidateTag } from 'next/cache';

import { pageActionClient } from '@/actions/safe-action';
import { Caching, OrganizationCacheKey } from '@/data/caching';
import { prisma } from '@/lib/db/prisma';
import { decodeBase64Image } from '@/lib/imaging/decode-base64-image';
import { resizeImage } from '@/lib/imaging/resize-image';
import { invalidateAgentConfigCache } from '@/lib/redis/agent-config-cache';
import { getAgentImageUrl } from '@/lib/urls/get-agent-image-url';
import { NotFoundError } from '@/lib/validation/exceptions';
import { updateAgentImageSchema } from '@/schemas/agents/update-agent-image-schema';
import { FileUploadAction } from '@/types/file-upload-action';
import type { Maybe } from '@/types/maybe';

export const updateAgentImage = pageActionClient('agents')
  .metadata({ actionName: 'updateAgentImage' })
  .schema(updateAgentImageSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const agent = await prisma.agent.findFirst({
      where: {
        id: parsedInput.id,
        organizationId: session.user.organizationId
      },
      select: { id: true, publicId: true }
    });
    if (!agent) {
      throw new NotFoundError('Agent not found');
    }

    let imageUrl: Maybe<string> = undefined;

    if (parsedInput.action === FileUploadAction.Update && parsedInput.image) {
      const { buffer, mimeType } = decodeBase64Image(parsedInput.image);
      const data = await resizeImage(buffer, mimeType);
      const hash = createHash('sha256').update(data).digest('hex');

      await prisma.$transaction([
        prisma.agentImage.deleteMany({
          where: { agentId: parsedInput.id }
        }),
        prisma.agentImage.create({
          data: {
            agentId: parsedInput.id,
            data,
            contentType: mimeType,
            hash
          }
        })
      ]);

      imageUrl = getAgentImageUrl(parsedInput.id, hash);
    }

    if (parsedInput.action === FileUploadAction.Delete) {
      await prisma.agentImage.deleteMany({
        where: { agentId: parsedInput.id }
      });
      imageUrl = null;
    }

    await prisma.agent.update({
      where: { id: agent.id },
      data: { image: imageUrl }
    });

    await invalidateAgentConfigCache(agent.publicId);

    revalidateTag(
      Caching.createOrganizationTag(
        OrganizationCacheKey.Agents,
        session.user.organizationId
      )
    );

    return { imageUrl: imageUrl ?? null };
  });

'use server';

import { z } from 'zod';

import { pageActionClient } from '@/actions/safe-action';
import { prisma } from '@/lib/db/prisma';
import {
  mailThreadAccessWhere,
  resolveMailAliasScope
} from '@/lib/inbox/mail-alias-scope';
import { NotFoundError } from '@/lib/validation/exceptions';

export const listMailThreadAttachments = pageActionClient('inbox')
  .metadata({ actionName: 'listMailThreadAttachments' })
  .schema(z.object({ threadId: z.string().uuid() }))
  .action(async ({ parsedInput, ctx: { session } }) => {
    const organizationId = session.user.organizationId;
    const scope = await resolveMailAliasScope({
      userId: session.user.id,
      organizationId
    });
    const thread = await prisma.mailThread.findFirst({
      where: {
        id: parsedInput.threadId,
        ...mailThreadAccessWhere({
          organizationId,
          userId: session.user.id,
          scope
        })
      },
      select: { id: true }
    });
    if (!thread) {
      throw new NotFoundError('Thread not found');
    }

    return prisma.mailMessageAttachment.findMany({
      where: {
        organizationId,
        message: { threadId: parsedInput.threadId }
      },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        filename: true,
        mediaType: true,
        sizeBytes: true
      }
    });
  });

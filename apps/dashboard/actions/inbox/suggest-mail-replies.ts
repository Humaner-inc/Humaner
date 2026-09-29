'use server';

import { suggestMailReplies } from '@/services/inbox/suggest-mail-replies';
import { z } from 'zod';

import { authActionClient } from '@/actions/safe-action';
import { prisma } from '@/lib/db/prisma';
import { htmlToPlainText } from '@/lib/inbox/mail-body-display';
import { NotFoundError, PreConditionError } from '@/lib/validation/exceptions';

export const suggestMailThreadReplies = authActionClient
  .metadata({ actionName: 'suggestMailThreadReplies' })
  .schema(z.object({ threadId: z.string().uuid() }))
  .action(async ({ parsedInput, ctx: { session } }) => {
    const organizationId = session.user.organizationId;
    if (!organizationId) throw new PreConditionError('No active organization');

    const thread = await prisma.mailThread.findFirst({
      where: {
        id: parsedInput.threadId,
        organizationId,
        alias: { members: { some: { userId: session.user.id } } }
      },
      select: {
        subject: true,
        alias: { select: { address: true } },
        messages: {
          orderBy: { sentAt: 'desc' },
          take: 1,
          select: {
            fromAddress: true,
            bodyText: true,
            bodyHtml: true,
            direction: true
          }
        }
      }
    });

    if (!thread) throw new NotFoundError('Thread not found');

    const latest =
      thread.messages.find((message) => message.direction === 'INBOUND') ??
      thread.messages[0];

    const bodyText =
      latest?.bodyText?.trim() ||
      (latest?.bodyHtml ? htmlToPlainText(latest.bodyHtml) : '') ||
      '';

    const suggestions = await suggestMailReplies({
      subject: thread.subject,
      fromAddress: latest?.fromAddress ?? 'unknown',
      aliasAddress: thread.alias.address,
      bodyText
    });

    return { suggestions };
  });

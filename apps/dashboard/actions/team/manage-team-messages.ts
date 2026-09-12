'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { authActionClient } from '@/actions/safe-action';
import { Routes } from '@/constants/routes';
import { getTeamWorkspaceFeed } from '@/data/team/get-team-workspace';
import { parseChatAttachments } from '@/lib/chat/chat-attachments';
import { prisma } from '@/lib/db/prisma';
import { notifyMentionedTeammates } from '@/lib/inbox/notify-mentions';
import { setTeamMessageAttachments } from '@/lib/team/persist-message-attachments';
import {
  PreConditionError,
  ValidationError
} from '@/lib/validation/exceptions';

export const loadTeamWorkspaceFeed = authActionClient
  .metadata({ actionName: 'loadTeamWorkspaceFeed' })
  .action(async () => getTeamWorkspaceFeed());

export const sendTeamMessageAction = authActionClient
  .metadata({ actionName: 'sendTeamMessage' })
  .schema(
    z.object({
      body: z.string().max(8000),
      attachments: z.array(z.unknown()).max(4).optional()
    })
  )
  .action(async ({ parsedInput, ctx: { session } }) => {
    const organizationId = session.user.organizationId;
    if (!organizationId) throw new PreConditionError('No active organization');

    const body = parsedInput.body.trim();
    const attachments = parseChatAttachments(parsedInput.attachments);
    if (!body && attachments.length === 0) {
      throw new ValidationError('Message cannot be empty');
    }

    const created = await prisma.teamMessage.create({
      data: {
        organizationId,
        authorId: session.user.id,
        body
      },
      select: {
        id: true,
        body: true,
        authorId: true,
        createdAt: true,
        author: { select: { name: true } }
      }
    });

    await setTeamMessageAttachments(created.id, attachments);

    if (body) {
      await notifyMentionedTeammates({
        organizationId,
        authorId: session.user.id,
        body,
        subject: 'Mentioned in a team message',
        content: `${session.user.name} mentioned you in Team messages.`,
        link: Routes.TeamPanel
      });
    }

    revalidatePath(Routes.Home);
    return {
      id: created.id,
      body: created.body,
      attachments,
      authorId: created.authorId,
      authorName: created.author.name,
      createdAt: created.createdAt.toISOString()
    };
  });

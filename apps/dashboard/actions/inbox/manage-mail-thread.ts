'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { authActionClient } from '@/actions/safe-action';
import { inboxThreadRoute } from '@/constants/inbox-nav-items';
import { Routes } from '@/constants/routes';
import { prisma } from '@/lib/db/prisma';
import { NotFoundError, PreConditionError } from '@/lib/validation/exceptions';

async function assertThreadAccess(
  threadId: string,
  userId: string,
  organizationId: string
) {
  const thread = await prisma.mailThread.findFirst({
    where: {
      id: threadId,
      organizationId,
      alias: { members: { some: { userId } } }
    },
    select: { id: true }
  });

  if (!thread) {
    throw new NotFoundError('Thread not found');
  }

  return thread;
}

function revalidateMailPaths(threadId: string): void {
  revalidatePath(Routes.InboxAll);
  revalidatePath(Routes.InboxAssigned);
  revalidatePath(Routes.InboxArchive);
  revalidatePath(inboxThreadRoute(threadId));
}

export const markMailThreadRead = authActionClient
  .metadata({ actionName: 'markMailThreadRead' })
  .schema(
    z.object({
      threadId: z.string().uuid(),
      isUnread: z.boolean()
    })
  )
  .action(async ({ parsedInput, ctx: { session } }) => {
    const organizationId = session.user.organizationId;
    if (!organizationId) throw new PreConditionError('No active organization');

    await assertThreadAccess(
      parsedInput.threadId,
      session.user.id,
      organizationId
    );

    await prisma.mailThread.update({
      where: { id: parsedInput.threadId },
      data: { isUnread: parsedInput.isUnread }
    });

    revalidateMailPaths(parsedInput.threadId);
    return { success: true };
  });

export const archiveMailThread = authActionClient
  .metadata({ actionName: 'archiveMailThread' })
  .schema(
    z.object({
      threadId: z.string().uuid(),
      archive: z.boolean().default(true)
    })
  )
  .action(async ({ parsedInput, ctx: { session } }) => {
    const organizationId = session.user.organizationId;
    if (!organizationId) throw new PreConditionError('No active organization');

    await assertThreadAccess(
      parsedInput.threadId,
      session.user.id,
      organizationId
    );

    await prisma.mailThread.update({
      where: { id: parsedInput.threadId },
      data: {
        archivedAt: parsedInput.archive ? new Date() : null
      }
    });

    revalidateMailPaths(parsedInput.threadId);
    return { success: true };
  });

export const deleteMailThread = authActionClient
  .metadata({ actionName: 'deleteMailThread' })
  .schema(z.object({ threadId: z.string().uuid() }))
  .action(async ({ parsedInput, ctx: { session } }) => {
    const organizationId = session.user.organizationId;
    if (!organizationId) throw new PreConditionError('No active organization');

    await assertThreadAccess(
      parsedInput.threadId,
      session.user.id,
      organizationId
    );

    await prisma.mailThread.delete({
      where: { id: parsedInput.threadId }
    });

    revalidateMailPaths(parsedInput.threadId);
    return { success: true };
  });

export const assignMailThread = authActionClient
  .metadata({ actionName: 'assignMailThread' })
  .schema(
    z.object({
      threadId: z.string().uuid(),
      assigneeId: z.string().uuid().nullable()
    })
  )
  .action(async ({ parsedInput, ctx: { session } }) => {
    const organizationId = session.user.organizationId;
    if (!organizationId) throw new PreConditionError('No active organization');

    await assertThreadAccess(
      parsedInput.threadId,
      session.user.id,
      organizationId
    );

    if (parsedInput.assigneeId) {
      const member = await prisma.organizationMembership.findUnique({
        where: {
          userId_organizationId: {
            userId: parsedInput.assigneeId,
            organizationId
          }
        },
        select: { id: true }
      });
      if (!member) {
        throw new PreConditionError('Assignee is not in this workspace');
      }
    }

    await prisma.mailThread.update({
      where: { id: parsedInput.threadId },
      data: { assigneeId: parsedInput.assigneeId }
    });

    revalidateMailPaths(parsedInput.threadId);
    return { success: true };
  });

export const applyMailThreadTag = authActionClient
  .metadata({ actionName: 'applyMailThreadTag' })
  .schema(
    z.object({
      threadId: z.string().uuid(),
      tagId: z.string().uuid().nullable()
    })
  )
  .action(async ({ parsedInput, ctx: { session } }) => {
    const organizationId = session.user.organizationId;
    if (!organizationId) throw new PreConditionError('No active organization');

    await assertThreadAccess(
      parsedInput.threadId,
      session.user.id,
      organizationId
    );

    await prisma.mailThreadTag.deleteMany({
      where: { threadId: parsedInput.threadId }
    });

    if (parsedInput.tagId) {
      const tag = await prisma.mailTag.findFirst({
        where: { id: parsedInput.tagId, organizationId },
        select: { id: true }
      });
      if (!tag) throw new NotFoundError('Tag not found');

      await prisma.mailThreadTag.create({
        data: {
          id: crypto.randomUUID(),
          threadId: parsedInput.threadId,
          tagId: tag.id
        }
      });
    }

    revalidateMailPaths(parsedInput.threadId);
    return { success: true };
  });

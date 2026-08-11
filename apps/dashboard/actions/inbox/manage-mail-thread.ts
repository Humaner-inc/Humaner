'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { authActionClient } from '@/actions/safe-action';
import { inboxThreadRoute } from '@/constants/inbox-nav-items';
import { Routes } from '@/constants/routes';
import { prisma } from '@/lib/db/prisma';
import { deleteImapMessagesForThreads } from '@/lib/inbox/delete-imap-messages';
import {
  aliasIdFilter,
  resolveMailAliasScope
} from '@/lib/inbox/mail-alias-scope';
import { publishOrgEvent } from '@/lib/realtime/org-events';
import {
  NotFoundError,
  PreConditionError,
  ValidationError
} from '@/lib/validation/exceptions';

async function assertThreadAccess(
  threadId: string,
  userId: string,
  organizationId: string
) {
  const scope = await resolveMailAliasScope({ userId, organizationId });
  const scopedAliasIds = aliasIdFilter(scope);
  if (scope.type === 'ids' && scope.aliasIds.length === 0) {
    throw new NotFoundError('Thread not found');
  }

  const thread = await prisma.mailThread.findFirst({
    where: {
      id: threadId,
      organizationId,
      ...(scopedAliasIds ? { aliasId: scopedAliasIds } : {})
    },
    select: { id: true, aliasId: true }
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

    try {
      await deleteImapMessagesForThreads(
        [parsedInput.threadId],
        organizationId
      );
    } catch (error) {
      throw new PreConditionError(
        error instanceof Error
          ? error.message
          : 'Could not delete messages from the mailbox'
      );
    }

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

    const current = await prisma.mailThread.findFirst({
      where: { id: parsedInput.threadId, organizationId },
      select: { assigneeId: true }
    });
    if (!current) {
      throw new NotFoundError('Thread not found');
    }

    // Compare-and-swap so concurrent assign/unassign cannot silently clobber.
    const updated = await prisma.mailThread.updateMany({
      where: {
        id: parsedInput.threadId,
        organizationId,
        assigneeId: current.assigneeId
      },
      data: { assigneeId: parsedInput.assigneeId }
    });

    if (updated.count === 0) {
      throw new PreConditionError(
        'This thread was updated by someone else. Refresh and try again.'
      );
    }

    void publishOrgEvent(organizationId, {
      type: 'thread.updated',
      resourceId: parsedInput.threadId,
      actorId: session.user.id,
      actorName: session.user.name
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

    const thread = await assertThreadAccess(
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
        select: { id: true, aliasId: true }
      });
      if (!tag) throw new NotFoundError('Tag not found');
      if (tag.aliasId && tag.aliasId !== thread.aliasId) {
        throw new ValidationError(
          'This tag is only available on another inbox'
        );
      }

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

async function assertThreadsAccess(
  threadIds: string[],
  userId: string,
  organizationId: string
): Promise<Array<{ id: string; aliasId: string }>> {
  const uniqueIds = [...new Set(threadIds)];
  if (uniqueIds.length === 0) {
    throw new PreConditionError('No threads selected');
  }

  const scope = await resolveMailAliasScope({ userId, organizationId });
  const scopedAliasIds = aliasIdFilter(scope);
  if (scope.type === 'ids' && scope.aliasIds.length === 0) {
    throw new NotFoundError('One or more threads were not found');
  }

  const threads = await prisma.mailThread.findMany({
    where: {
      id: { in: uniqueIds },
      organizationId,
      ...(scopedAliasIds ? { aliasId: scopedAliasIds } : {})
    },
    select: { id: true, aliasId: true }
  });

  if (threads.length !== uniqueIds.length) {
    throw new NotFoundError('One or more threads were not found');
  }

  return threads;
}

function revalidateMailListPaths(): void {
  revalidatePath(Routes.InboxAll);
  revalidatePath(Routes.InboxAssigned);
  revalidatePath(Routes.InboxArchive);
}

export const bulkArchiveMailThreads = authActionClient
  .metadata({ actionName: 'bulkArchiveMailThreads' })
  .schema(
    z.object({
      threadIds: z.array(z.string().uuid()).min(1).max(200),
      archive: z.boolean().default(true)
    })
  )
  .action(async ({ parsedInput, ctx: { session } }) => {
    const organizationId = session.user.organizationId;
    if (!organizationId) throw new PreConditionError('No active organization');

    const threads = await assertThreadsAccess(
      parsedInput.threadIds,
      session.user.id,
      organizationId
    );
    const threadIds = threads.map((thread) => thread.id);

    await prisma.mailThread.updateMany({
      where: { id: { in: threadIds }, organizationId },
      data: {
        archivedAt: parsedInput.archive ? new Date() : null
      }
    });

    revalidateMailListPaths();
    return { success: true, count: threadIds.length };
  });

export const bulkDeleteMailThreads = authActionClient
  .metadata({ actionName: 'bulkDeleteMailThreads' })
  .schema(
    z.object({
      threadIds: z.array(z.string().uuid()).min(1).max(200)
    })
  )
  .action(async ({ parsedInput, ctx: { session } }) => {
    const organizationId = session.user.organizationId;
    if (!organizationId) throw new PreConditionError('No active organization');

    const threads = await assertThreadsAccess(
      parsedInput.threadIds,
      session.user.id,
      organizationId
    );
    const threadIds = threads.map((thread) => thread.id);

    try {
      await deleteImapMessagesForThreads(threadIds, organizationId);
    } catch (error) {
      throw new PreConditionError(
        error instanceof Error
          ? error.message
          : 'Could not delete messages from the mailbox'
      );
    }

    await prisma.mailThread.deleteMany({
      where: { id: { in: threadIds }, organizationId }
    });

    revalidateMailListPaths();
    return { success: true, count: threadIds.length };
  });

export const bulkAssignMailThreads = authActionClient
  .metadata({ actionName: 'bulkAssignMailThreads' })
  .schema(
    z.object({
      threadIds: z.array(z.string().uuid()).min(1).max(200),
      assigneeId: z.string().uuid().nullable()
    })
  )
  .action(async ({ parsedInput, ctx: { session } }) => {
    const organizationId = session.user.organizationId;
    if (!organizationId) throw new PreConditionError('No active organization');

    const threads = await assertThreadsAccess(
      parsedInput.threadIds,
      session.user.id,
      organizationId
    );
    const threadIds = threads.map((thread) => thread.id);

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

    await prisma.mailThread.updateMany({
      where: { id: { in: threadIds }, organizationId },
      data: { assigneeId: parsedInput.assigneeId }
    });

    revalidateMailListPaths();
    return { success: true, count: threadIds.length };
  });

export const bulkApplyMailThreadTag = authActionClient
  .metadata({ actionName: 'bulkApplyMailThreadTag' })
  .schema(
    z.object({
      threadIds: z.array(z.string().uuid()).min(1).max(200),
      tagId: z.string().uuid().nullable()
    })
  )
  .action(async ({ parsedInput, ctx: { session } }) => {
    const organizationId = session.user.organizationId;
    if (!organizationId) throw new PreConditionError('No active organization');

    const threads = await assertThreadsAccess(
      parsedInput.threadIds,
      session.user.id,
      organizationId
    );
    const threadIds = threads.map((thread) => thread.id);

    await prisma.mailThreadTag.deleteMany({
      where: { threadId: { in: threadIds } }
    });

    if (parsedInput.tagId) {
      const tag = await prisma.mailTag.findFirst({
        where: { id: parsedInput.tagId, organizationId },
        select: { id: true, aliasId: true }
      });
      if (!tag) throw new NotFoundError('Tag not found');
      if (
        tag.aliasId &&
        threads.some((thread) => thread.aliasId !== tag.aliasId)
      ) {
        throw new ValidationError(
          'This tag is only available on a specific inbox'
        );
      }

      await prisma.mailThreadTag.createMany({
        data: threadIds.map((threadId) => ({
          id: crypto.randomUUID(),
          threadId,
          tagId: tag.id
        }))
      });
    }

    revalidateMailListPaths();
    return { success: true, count: threadIds.length };
  });

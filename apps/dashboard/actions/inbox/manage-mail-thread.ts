'use server';

import { revalidatePath } from 'next/cache';
import { after } from 'next/server';
import { MailThreadFolder } from '@prisma/client';
import { z } from 'zod';

import { authActionClient } from '@/actions/safe-action';
import { Routes } from '@/constants/routes';
import { prisma } from '@/lib/db/prisma';
import {
  deleteMailThreadTagsForThreads,
  updateMailThreadsByIds
} from '@/lib/db/unique-mutations';
import {
  aliasIdFilter,
  mailThreadAccessWhere,
  resolveMailAliasScope
} from '@/lib/inbox/mail-alias-scope';
import {
  applyMailThreadAssignee,
  COMPANION_ASSIGNEE,
  parseMailAssigneeInput
} from '@/lib/inbox/mail-assignee';
import { mailFolderWriteData } from '@/lib/inbox/mail-thread-folder';
import {
  listTrashThreadIds,
  permanentlyDeleteMailThreads,
  TRASH_DELETE_BATCH_SIZE
} from '@/lib/inbox/permanently-delete-mail-threads';
import {
  providerActionForFolder,
  syncProviderMailAction,
  syncProviderMailActions
} from '@/lib/inbox/sync-provider-mail-action';
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

  const thread = await prisma.mailThread.findFirst({
    where: {
      id: threadId,
      ...mailThreadAccessWhere({
        organizationId,
        userId,
        scope
      })
    },
    select: { id: true, aliasId: true, folder: true }
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
  revalidatePath(Routes.InboxSent);
  revalidatePath(Routes.InboxSpam);
  revalidatePath(Routes.InboxTrash);
  revalidatePath(Routes.InboxDrafts);
  revalidatePath(Routes.InboxAll);
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

    try {
      await syncProviderMailAction({
        threadId: parsedInput.threadId,
        organizationId,
        action: parsedInput.isUnread ? 'unread' : 'read'
      });
    } catch (error) {
      throw new PreConditionError(
        error instanceof Error
          ? error.message
          : 'Could not sync read state to the mailbox'
      );
    }

    await prisma.mailThread.update({
      where: { id: parsedInput.threadId },
      data: { isUnread: parsedInput.isUnread }
    });

    try {
      after(() => {
        revalidateMailPaths(parsedInput.threadId);
      });
    } catch {
      revalidateMailPaths(parsedInput.threadId);
    }
    return { success: true };
  });

export const pinMailThread = authActionClient
  .metadata({ actionName: 'pinMailThread' })
  .schema(
    z.object({
      threadId: z.string().uuid(),
      isPinned: z.boolean()
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
      data: { isPinned: parsedInput.isPinned }
    });

    try {
      after(() => {
        revalidateMailPaths(parsedInput.threadId);
      });
    } catch {
      revalidateMailPaths(parsedInput.threadId);
    }
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

    try {
      await syncProviderMailAction({
        threadId: parsedInput.threadId,
        organizationId,
        action: parsedInput.archive ? 'archive' : 'unarchive'
      });
    } catch (error) {
      throw new PreConditionError(
        error instanceof Error
          ? error.message
          : 'Could not sync archive to the mailbox'
      );
    }

    await prisma.mailThread.update({
      where: { id: parsedInput.threadId },
      data: parsedInput.archive
        ? { archivedAt: new Date() }
        : {
            archivedAt: null,
            folder: MailThreadFolder.INBOX,
            trashedAt: null
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

    const thread = await assertThreadAccess(
      parsedInput.threadId,
      session.user.id,
      organizationId
    );

    if (thread.folder === MailThreadFolder.TRASH) {
      try {
        await permanentlyDeleteMailThreads(
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
    } else {
      try {
        await syncProviderMailAction({
          threadId: parsedInput.threadId,
          organizationId,
          action: 'trash'
        });
      } catch (error) {
        throw new PreConditionError(
          error instanceof Error
            ? error.message
            : 'Could not sync trash to the mailbox'
        );
      }
      await prisma.mailThread.update({
        where: { id: parsedInput.threadId },
        data: mailFolderWriteData(MailThreadFolder.TRASH)
      });
    }

    revalidateMailPaths(parsedInput.threadId);
    return { success: true };
  });

const mailFolderInput = z.enum(['INBOX', 'SENT', 'SPAM', 'TRASH']);

export const moveMailThreadFolder = authActionClient
  .metadata({ actionName: 'moveMailThreadFolder' })
  .schema(
    z.object({
      threadId: z.string().uuid(),
      folder: mailFolderInput
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

    const providerAction = providerActionForFolder(parsedInput.folder);
    if (providerAction) {
      try {
        await syncProviderMailAction({
          threadId: parsedInput.threadId,
          organizationId,
          action: providerAction
        });
      } catch (error) {
        throw new PreConditionError(
          error instanceof Error
            ? error.message
            : 'Could not sync folder move to the mailbox'
        );
      }
    }

    await prisma.mailThread.update({
      where: { id: parsedInput.threadId },
      data: mailFolderWriteData(parsedInput.folder)
    });

    revalidateMailPaths(parsedInput.threadId);
    return { success: true };
  });

const mailAssigneeInput = z.union([
  z.string().uuid(),
  z.literal(COMPANION_ASSIGNEE)
]);

export const assignMailThread = authActionClient
  .metadata({ actionName: 'assignMailThread' })
  .schema(
    z.object({
      threadId: z.string().uuid(),
      assigneeId: mailAssigneeInput.nullable()
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

    const applied = await applyMailThreadAssignee({
      threadId: parsedInput.threadId,
      organizationId,
      assignee: parsedInput.assigneeId
    });
    if (!applied.ok) {
      throw new PreConditionError(
        applied.reason === 'conflict'
          ? 'This thread was updated by someone else. Refresh and try again.'
          : 'Assignee is not in this workspace'
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

    await deleteMailThreadTagsForThreads(prisma, [parsedInput.threadId]);

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
): Promise<Array<{ id: string; aliasId: string; folder: MailThreadFolder }>> {
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
    select: { id: true, aliasId: true, folder: true }
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
  revalidatePath(Routes.InboxSent);
  revalidatePath(Routes.InboxSpam);
  revalidatePath(Routes.InboxTrash);
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

    try {
      await syncProviderMailActions({
        threadIds,
        organizationId,
        action: parsedInput.archive ? 'archive' : 'unarchive'
      });
    } catch (error) {
      throw new PreConditionError(
        error instanceof Error
          ? error.message
          : 'Could not sync archive to the mailbox'
      );
    }

    await updateMailThreadsByIds(
      prisma,
      threadIds,
      parsedInput.archive
        ? { archivedAt: new Date() }
        : {
            archivedAt: null,
            folder: MailThreadFolder.INBOX,
            trashedAt: null
          }
    );

    revalidateMailListPaths();
    return { success: true, count: threadIds.length };
  });

export const bulkMoveMailThreads = authActionClient
  .metadata({ actionName: 'bulkMoveMailThreads' })
  .schema(
    z.object({
      threadIds: z.array(z.string().uuid()).min(1).max(200),
      folder: mailFolderInput
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

    const providerAction = providerActionForFolder(parsedInput.folder);
    if (providerAction) {
      try {
        await syncProviderMailActions({
          threadIds,
          organizationId,
          action: providerAction
        });
      } catch (error) {
        throw new PreConditionError(
          error instanceof Error
            ? error.message
            : 'Could not sync folder move to the mailbox'
        );
      }
    }

    await updateMailThreadsByIds(
      prisma,
      threadIds,
      mailFolderWriteData(parsedInput.folder)
    );

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
    const trashIds = threads
      .filter((thread) => thread.folder === MailThreadFolder.TRASH)
      .map((thread) => thread.id);
    const moveIds = threads
      .filter((thread) => thread.folder !== MailThreadFolder.TRASH)
      .map((thread) => thread.id);

    if (moveIds.length > 0) {
      try {
        await syncProviderMailActions({
          threadIds: moveIds,
          organizationId,
          action: 'trash'
        });
      } catch (error) {
        throw new PreConditionError(
          error instanceof Error
            ? error.message
            : 'Could not sync trash to the mailbox'
        );
      }
      await updateMailThreadsByIds(
        prisma,
        moveIds,
        mailFolderWriteData(MailThreadFolder.TRASH)
      );
    }

    if (trashIds.length > 0) {
      try {
        await permanentlyDeleteMailThreads(trashIds, organizationId);
      } catch (error) {
        throw new PreConditionError(
          error instanceof Error
            ? error.message
            : 'Could not delete messages from the mailbox'
        );
      }
    }

    revalidateMailListPaths();
    return { success: true, count: threads.length };
  });

export const bulkAssignMailThreads = authActionClient
  .metadata({ actionName: 'bulkAssignMailThreads' })
  .schema(
    z.object({
      threadIds: z.array(z.string().uuid()).min(1).max(200),
      assigneeId: mailAssigneeInput.nullable()
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
    const next = parseMailAssigneeInput(parsedInput.assigneeId);

    if (next.assigneeKind === 'HUMAN' && next.assigneeId) {
      const member = await prisma.organizationMembership.findUnique({
        where: {
          userId_organizationId: {
            userId: next.assigneeId,
            organizationId
          }
        },
        select: { id: true }
      });
      if (!member) {
        throw new PreConditionError('Assignee is not in this workspace');
      }
    }

    await updateMailThreadsByIds(prisma, threadIds, {
      assigneeKind: next.assigneeKind,
      assigneeId: next.assigneeId
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

    await deleteMailThreadTagsForThreads(prisma, threadIds);

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

const MAX_EMPTY_TRASH_BATCHES = 200;

export const emptyTrash = authActionClient
  .metadata({ actionName: 'emptyTrash' })
  .schema(
    z.object({
      connectionId: z.string().uuid().nullable().optional()
    })
  )
  .action(async ({ parsedInput, ctx: { session } }) => {
    const organizationId = session.user.organizationId;
    if (!organizationId) throw new PreConditionError('No active organization');

    const scope = await resolveMailAliasScope({
      userId: session.user.id,
      organizationId
    });
    const accessWhere = mailThreadAccessWhere({
      organizationId,
      userId: session.user.id,
      scope
    });

    let count = 0;

    for (let batch = 0; batch < MAX_EMPTY_TRASH_BATCHES; batch += 1) {
      const threadIds = await listTrashThreadIds({
        accessWhere,
        connectionId: parsedInput.connectionId,
        take: TRASH_DELETE_BATCH_SIZE
      });
      if (threadIds.length === 0) break;

      try {
        count += await permanentlyDeleteMailThreads(threadIds, organizationId);
      } catch (error) {
        throw new PreConditionError(
          error instanceof Error
            ? error.message
            : 'Could not delete messages from the mailbox'
        );
      }

      if (threadIds.length < TRASH_DELETE_BATCH_SIZE) break;
    }

    revalidateMailListPaths();
    return { success: true, count };
  });

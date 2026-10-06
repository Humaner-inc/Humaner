'use server';

import { revalidatePath } from 'next/cache';
import { WorkspaceRole } from '@prisma/client';
import { z } from 'zod';

import { pageActionClient } from '@/actions/safe-action';
import { Routes } from '@/constants/routes';
import { prisma } from '@/lib/db/prisma';
import {
  mailThreadAccessWhere,
  resolveMailAliasScope
} from '@/lib/inbox/mail-alias-scope';
import {
  sendMailThreadNote,
  updateSharedNoteDraft
} from '@/lib/inbox/mail-thread-notes';
import { publishOrgEvent } from '@/lib/realtime/org-events';
import {
  ForbiddenError,
  NotFoundError,
  PreConditionError
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
    select: { id: true, subject: true }
  });
  if (!thread) {
    throw new NotFoundError('Thread not found');
  }
  return thread;
}

function revalidateNotePaths(): void {
  revalidatePath(Routes.InboxAll);
}

export const saveMailThreadNoteDraft = pageActionClient('inbox')
  .metadata({ actionName: 'saveMailThreadNoteDraft' })
  .schema(
    z.object({
      threadId: z.string().uuid(),
      body: z.string().max(8000)
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

    await updateSharedNoteDraft({
      threadId: parsedInput.threadId,
      organizationId,
      authorId: session.user.id,
      body: parsedInput.body
    });

    return { success: true };
  });

export const sendMailThreadNoteAction = pageActionClient('inbox')
  .metadata({ actionName: 'sendMailThreadNote' })
  .schema(
    z.object({
      threadId: z.string().uuid(),
      body: z.string().trim().min(1).max(8000)
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

    const note = await sendMailThreadNote({
      threadId: parsedInput.threadId,
      organizationId,
      authorId: session.user.id,
      authorName: session.user.name,
      subject: thread.subject,
      body: parsedInput.body
    });

    void publishOrgEvent(organizationId, {
      type: 'thread.updated',
      resourceId: parsedInput.threadId,
      actorId: session.user.id,
      actorName: session.user.name
    });

    revalidateNotePaths();
    return note;
  });

export const deleteMailThreadNotesAction = pageActionClient('inbox')
  .metadata({ actionName: 'deleteMailThreadNotes' })
  .schema(z.object({ threadId: z.string().uuid() }))
  .action(async ({ parsedInput, ctx: { session } }) => {
    const organizationId = session.user.organizationId;
    if (!organizationId) throw new PreConditionError('No active organization');

    await assertThreadAccess(
      parsedInput.threadId,
      session.user.id,
      organizationId
    );

    const [membership, authors] = await Promise.all([
      prisma.organizationMembership.findUnique({
        where: {
          userId_organizationId: {
            userId: session.user.id,
            organizationId
          }
        },
        select: { workspaceRole: true }
      }),
      prisma.mailThreadNote.findMany({
        where: { threadId: parsedInput.threadId },
        select: { authorId: true }
      })
    ]);

    const isOwner = membership?.workspaceRole === WorkspaceRole.OWNER;
    const onlyOwnNotes =
      authors.length === 0 ||
      authors.every((note) => note.authorId === session.user.id);
    if (!isOwner && !onlyOwnNotes) {
      throw new ForbiddenError(
        'Only the note authors or the workspace owner can delete these notes'
      );
    }

    await prisma.$transaction(async (tx) => {
      const notes = await tx.mailThreadNote.findMany({
        where: { threadId: parsedInput.threadId },
        select: { id: true }
      });
      for (const note of notes) {
        await tx.mailThreadNote.delete({ where: { id: note.id } });
      }
      await tx.mailThread.update({
        where: { id: parsedInput.threadId },
        data: {
          sharedNoteDraft: null,
          sharedNoteDraftUpdatedAt: new Date(),
          sharedNoteDraftAuthorId: session.user.id
        }
      });
    });

    void publishOrgEvent(organizationId, {
      type: 'thread.updated',
      resourceId: parsedInput.threadId,
      actorId: session.user.id,
      actorName: session.user.name
    });

    revalidateNotePaths();
    return { threadId: parsedInput.threadId };
  });

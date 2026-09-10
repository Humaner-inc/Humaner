'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { pageActionClient } from '@/actions/safe-action';
import { inboxThreadRoute } from '@/constants/inbox-nav-items';
import { Routes } from '@/constants/routes';
import { prisma } from '@/lib/db/prisma';
import {
  aliasIdFilter,
  resolveMailAliasScope
} from '@/lib/inbox/mail-alias-scope';
import {
  sendMailThreadNote,
  updateSharedNoteDraft
} from '@/lib/inbox/mail-thread-notes';
import { publishOrgEvent } from '@/lib/realtime/org-events';
import { NotFoundError, PreConditionError } from '@/lib/validation/exceptions';

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
    select: { id: true }
  });
  if (!thread) {
    throw new NotFoundError('Thread not found');
  }
}

function revalidateNotePaths(threadId: string): void {
  revalidatePath(Routes.InboxAll);
  revalidatePath(inboxThreadRoute(threadId));
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

    await assertThreadAccess(
      parsedInput.threadId,
      session.user.id,
      organizationId
    );

    const note = await sendMailThreadNote({
      threadId: parsedInput.threadId,
      organizationId,
      authorId: session.user.id,
      body: parsedInput.body
    });

    void publishOrgEvent(organizationId, {
      type: 'thread.updated',
      resourceId: parsedInput.threadId,
      actorId: session.user.id,
      actorName: session.user.name
    });

    revalidateNotePaths(parsedInput.threadId);
    return note;
  });

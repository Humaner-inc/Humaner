'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { pageActionClientAny } from '@/actions/safe-action';
import { inboxThreadRoute } from '@/constants/inbox-nav-items';
import { Routes } from '@/constants/routes';
import { createTaskFromMailThread } from '@/lib/inbox/create-task-from-thread';
import { publishOrgEvent } from '@/lib/realtime/org-events';
import { NotFoundError, PreConditionError } from '@/lib/validation/exceptions';

export const createTaskFromMailThreadAction = pageActionClientAny(
  'inbox',
  'tasks'
)
  .metadata({ actionName: 'createTaskFromMailThread' })
  .schema(z.object({ threadId: z.string().uuid() }))
  .action(async ({ parsedInput, ctx: { session } }) => {
    const organizationId = session.user.organizationId;

    try {
      const ticket = await createTaskFromMailThread({
        threadId: parsedInput.threadId,
        organizationId,
        assigneeId: session.user.id
      });

      void publishOrgEvent(organizationId, {
        type: 'ticket.updated',
        resourceId: ticket.id,
        actorId: session.user.id,
        actorName: session.user.name
      });

      revalidatePath(Routes.Tasks);
      revalidatePath(inboxThreadRoute(parsedInput.threadId));
      return ticket;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not create task';
      if (message === 'Thread not found') {
        throw new NotFoundError(message);
      }
      throw new PreConditionError(message);
    }
  });

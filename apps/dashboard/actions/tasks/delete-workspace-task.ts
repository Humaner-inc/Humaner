'use server';

import { revalidatePath } from 'next/cache';

import { pageActionClientAny } from '@/actions/safe-action';
import { Routes } from '@/constants/routes';
import { requireOrganizationCapability } from '@/lib/billing/capabilities';
import { prisma } from '@/lib/db/prisma';
import { publishOrgEvent } from '@/lib/realtime/org-events';
import { NotFoundError } from '@/lib/validation/exceptions';
import { deleteWorkspaceTaskSchema } from '@/schemas/tasks/delete-workspace-task-schema';

export const deleteWorkspaceTask = pageActionClientAny('desk', 'tasks')
  .metadata({ actionName: 'deleteWorkspaceTask' })
  .schema(deleteWorkspaceTaskSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    await requireOrganizationCapability(
      session.user.organizationId,
      'tasks',
      'Tasks are included on Inbox. Upgrade to create and manage tasks.'
    );
    const ticket = await prisma.handoffTicket.findFirst({
      where: {
        id: parsedInput.id,
        organizationId: session.user.organizationId
      },
      select: { id: true }
    });

    if (!ticket) {
      throw new NotFoundError('Task not found');
    }

    await prisma.handoffTicket.delete({
      where: { id: ticket.id }
    });

    void publishOrgEvent(session.user.organizationId, {
      type: 'ticket.updated',
      resourceId: ticket.id,
      actorId: session.user.id,
      actorName: session.user.name
    });

    revalidatePath(Routes.Tasks);
    revalidatePath(Routes.InboxAssigned);
    revalidatePath(Routes.Desk);
    revalidatePath(Routes.DeskHuman);
  });

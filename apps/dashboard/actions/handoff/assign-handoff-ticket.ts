'use server';

import { revalidatePath } from 'next/cache';

import { pageActionClient } from '@/actions/safe-action';
import { Routes } from '@/constants/routes';
import { prisma } from '@/lib/db/prisma';
import { publishOrgEvent } from '@/lib/realtime/org-events';
import { NotFoundError, PreConditionError } from '@/lib/validation/exceptions';
import { assignHandoffTicketSchema } from '@/schemas/handoff/human-desk-schema';

export const assignHandoffTicket = pageActionClient('desk')
  .metadata({ actionName: 'assignHandoffTicket' })
  .schema(assignHandoffTicketSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const ticket = await prisma.handoffTicket.findFirst({
      where: {
        id: parsedInput.id,
        organizationId: session.user.organizationId
      },
      select: {
        id: true,
        status: true,
        assigneeId: true
      }
    });

    if (!ticket) {
      throw new NotFoundError('Ticket not found');
    }

    if (parsedInput.assigneeId) {
      const membership = await prisma.organizationMembership.findFirst({
        where: {
          userId: parsedInput.assigneeId,
          organizationId: session.user.organizationId
        },
        select: { id: true }
      });

      if (!membership) {
        throw new NotFoundError('Teammate not found');
      }
    }

    const isAssigning = parsedInput.assigneeId !== null;
    const shouldStartProgress =
      isAssigning &&
      (ticket.status === 'OPEN' || ticket.status === 'IN_PROGRESS');

    // Compare-and-swap on assigneeId so two agents cannot silently overwrite
    // each other's claim.
    const updated = await prisma.handoffTicket.updateMany({
      where: {
        id: ticket.id,
        organizationId: session.user.organizationId,
        assigneeId: ticket.assigneeId
      },
      data: {
        assigneeId: parsedInput.assigneeId,
        assignedAt: isAssigning ? new Date() : null,
        ...(shouldStartProgress && ticket.status === 'OPEN'
          ? { status: 'IN_PROGRESS' }
          : {})
      }
    });

    if (updated.count === 0) {
      throw new PreConditionError(
        'This ticket was updated by someone else. Refresh and try again.'
      );
    }

    void publishOrgEvent(session.user.organizationId, {
      type: 'ticket.updated',
      resourceId: ticket.id,
      actorId: session.user.id,
      actorName: session.user.name
    });

    revalidatePath(Routes.Desk);
    revalidatePath(Routes.DeskHuman);
    revalidatePath(Routes.Home);
    revalidatePath(Routes.HumanDesk);
  });

'use server';

import { revalidatePath } from 'next/cache';

import { pageActionClient } from '@/actions/safe-action';
import { Routes } from '@/constants/routes';
import { prisma } from '@/lib/db/prisma';
import { NotFoundError } from '@/lib/validation/exceptions';
import { assignHandoffTicketSchema } from '@/schemas/handoff/human-desk-schema';

export const assignHandoffTicket = pageActionClient('human-desk')
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
      const assignee = await prisma.user.findFirst({
        where: {
          id: parsedInput.assigneeId,
          organizationId: session.user.organizationId
        },
        select: { id: true }
      });

      if (!assignee) {
        throw new NotFoundError('Teammate not found');
      }
    }

    const isAssigning = parsedInput.assigneeId !== null;
    const shouldStartProgress =
      isAssigning &&
      (ticket.status === 'OPEN' || ticket.status === 'IN_PROGRESS');

    await prisma.handoffTicket.update({
      where: { id: ticket.id },
      data: {
        assigneeId: parsedInput.assigneeId,
        assignedAt: isAssigning ? new Date() : null,
        ...(shouldStartProgress && ticket.status === 'OPEN'
          ? { status: 'IN_PROGRESS' }
          : {})
      }
    });

    revalidatePath(Routes.HumanDesk);
  });

'use server';

import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';

import { pageActionClientAny } from '@/actions/safe-action';
import { Routes } from '@/constants/routes';
import { prisma } from '@/lib/db/prisma';
import { isPrismaSerializationFailure } from '@/lib/db/unique-mutations';
import { publishOrgEvent } from '@/lib/realtime/org-events';
import { NotFoundError, PreConditionError } from '@/lib/validation/exceptions';
import { assignHandoffTicketSchema } from '@/schemas/handoff/human-desk-schema';

export const assignHandoffTicket = pageActionClientAny(
  'desk',
  'human-desk',
  'tasks'
)
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

    try {
      await prisma.$transaction(
        async (tx) => {
          const current = await tx.handoffTicket.findUnique({
            where: { id: ticket.id },
            select: {
              organizationId: true,
              assigneeId: true
            }
          });
          if (
            !current ||
            current.organizationId !== session.user.organizationId ||
            current.assigneeId !== ticket.assigneeId
          ) {
            throw new PreConditionError(
              'This ticket was updated by someone else. Refresh and try again.'
            );
          }
          await tx.handoffTicket.update({
            where: { id: ticket.id },
            data: {
              assigneeId: parsedInput.assigneeId,
              assignedAt: isAssigning ? new Date() : null,
              ...(shouldStartProgress && ticket.status === 'OPEN'
                ? { status: 'IN_PROGRESS' }
                : {})
            }
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
      );
    } catch (error) {
      if (
        isPrismaSerializationFailure(error) ||
        error instanceof PreConditionError
      ) {
        throw new PreConditionError(
          'This ticket was updated by someone else. Refresh and try again.'
        );
      }
      throw error;
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
    revalidatePath(Routes.Tasks);
    revalidatePath(Routes.InboxAssigned);
  });

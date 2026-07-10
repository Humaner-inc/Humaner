'use server';

import { revalidatePath } from 'next/cache';

import { authActionClient } from '@/actions/safe-action';
import { isAdmin } from '@/lib/auth/permissions';
import { prisma } from '@/lib/db/prisma';
import { ForbiddenError, NotFoundError } from '@/lib/validation/exceptions';
import { addSupportTicketMessageSchema } from '@/schemas/support/support-ticket-schemas';

export const addSupportTicketMessage = authActionClient
  .metadata({ actionName: 'addSupportTicketMessage' })
  .schema(addSupportTicketMessageSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: parsedInput.ticketId },
      select: { id: true, userId: true }
    });
    if (!ticket) {
      throw new NotFoundError('Ticket not found');
    }

    const admin = await isAdmin(session.user.id);
    const isOwner = ticket.userId === session.user.id;
    if (!isOwner && !admin) {
      throw new ForbiddenError('You cannot reply to this ticket');
    }

    await prisma.$transaction([
      prisma.supportTicketMessage.create({
        data: {
          ticketId: parsedInput.ticketId,
          userId: session.user.id,
          body: parsedInput.body.trim(),
          isStaff: admin && !isOwner
        }
      }),
      prisma.supportTicket.update({
        where: { id: parsedInput.ticketId },
        data: { updatedAt: new Date() }
      })
    ]);

    revalidatePath('/dashboard/admin/tickets');

    return { success: true };
  });

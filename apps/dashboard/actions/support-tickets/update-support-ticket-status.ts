'use server';

import { revalidatePath } from 'next/cache';

import { authActionClient } from '@/actions/safe-action';
import { Routes } from '@/constants/routes';
import { requireAdmin } from '@/lib/auth/permissions';
import { prisma } from '@/lib/db/prisma';
import { NotFoundError } from '@/lib/validation/exceptions';
import { updateSupportTicketStatusSchema } from '@/schemas/support/support-ticket-schemas';

export const updateSupportTicketStatus = authActionClient
  .metadata({ actionName: 'updateSupportTicketStatus' })
  .schema(updateSupportTicketStatusSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    await requireAdmin(session.user.id);

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: parsedInput.ticketId },
      select: { id: true }
    });
    if (!ticket) {
      throw new NotFoundError('Ticket not found');
    }

    await prisma.supportTicket.update({
      where: { id: parsedInput.ticketId },
      data: { status: parsedInput.status, updatedAt: new Date() }
    });

    revalidatePath(Routes.AdminTickets);

    return { success: true };
  });

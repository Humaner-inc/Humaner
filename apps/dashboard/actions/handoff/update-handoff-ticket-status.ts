'use server';

import { revalidatePath } from 'next/cache';

import { pageActionClient } from '@/actions/safe-action';
import { Routes } from '@/constants/routes';
import { prisma } from '@/lib/db/prisma';
import { NotFoundError } from '@/lib/validation/exceptions';
import { updateHandoffTicketStatusSchema } from '@/schemas/handoff/human-desk-schema';

export const updateHandoffTicketStatus = pageActionClient('human-desk')
  .metadata({ actionName: 'updateHandoffTicketStatus' })
  .schema(updateHandoffTicketStatusSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const ticket = await prisma.handoffTicket.findFirst({
      where: {
        id: parsedInput.id,
        organizationId: session.user.organizationId
      },
      select: { id: true }
    });
    if (!ticket) {
      throw new NotFoundError('Ticket not found');
    }

    await prisma.handoffTicket.update({
      where: { id: ticket.id },
      data: { status: parsedInput.status }
    });

    revalidatePath(Routes.HumanDesk);
  });

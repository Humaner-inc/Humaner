'use server';

import { revalidatePath } from 'next/cache';

import { authActionClient } from '@/actions/safe-action';
import { Routes } from '@/constants/routes';
import { prisma } from '@/lib/db/prisma';
import { assertTicketScreenshotPath } from '@/lib/storage/ticket-screenshot-storage';
import { createSupportTicketSchema } from '@/schemas/support/support-ticket-schemas';

export const createSupportTicket = authActionClient
  .metadata({ actionName: 'createSupportTicket' })
  .schema(createSupportTicketSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const screenshotPath = parsedInput.screenshotPath.trim();
    assertTicketScreenshotPath(screenshotPath, session.user.id);

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: session.user.id,
        title: parsedInput.title.trim(),
        body: parsedInput.body.trim(),
        contextTab: parsedInput.contextTab.trim(),
        contextFeature: parsedInput.contextFeature?.trim() || null,
        screenshotPath
      }
    });

    revalidatePath(Routes.AdminTickets);

    return { ticketId: ticket.id };
  });

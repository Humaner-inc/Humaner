'use server';

import { authActionClient } from '@/actions/safe-action';
import { isAdmin } from '@/lib/auth/permissions';
import { prisma } from '@/lib/db/prisma';
import {
  ForbiddenError,
  NotFoundError
} from '@/lib/validation/exceptions';
import { createTicketScreenshotSignedReadUrl } from '@/lib/storage/ticket-screenshot-storage';
import { supportTicketIdSchema } from '@/schemas/support/support-ticket-schemas';

export type SupportTicketMessageDto = {
  id: string;
  body: string;
  isStaff: boolean;
  createdAt: string;
  authorName: string;
  authorId: string;
};

export type SupportTicketDetailDto = {
  id: string;
  title: string;
  body: string;
  contextTab: string;
  contextFeature: string | null;
  screenshotUrl: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  messages: SupportTicketMessageDto[];
  requesterEmail: string | null;
  requesterName: string | null;
};

export const getSupportTicketDetail = authActionClient
  .metadata({ actionName: 'getSupportTicketDetail' })
  .schema(supportTicketIdSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: parsedInput.ticketId },
      include: {
        user: { select: { email: true, name: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: { select: { id: true, name: true } }
          }
        }
      }
    });

    if (!ticket) {
      throw new NotFoundError('Ticket not found');
    }

    const admin = await isAdmin(session.user.id);
    if (ticket.userId !== session.user.id && !admin) {
      throw new ForbiddenError('You cannot view this ticket');
    }

    let screenshotUrl: string | null = null;
    if (ticket.screenshotPath) {
      screenshotUrl = await createTicketScreenshotSignedReadUrl(
        ticket.screenshotPath
      );
    }

    return {
      id: ticket.id,
      title: ticket.title,
      body: ticket.body,
      contextTab: ticket.contextTab,
      contextFeature: ticket.contextFeature,
      screenshotUrl,
      status: ticket.status,
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString(),
      requesterEmail: ticket.user.email,
      requesterName: ticket.user.name,
      messages: ticket.messages.map((message) => ({
        id: message.id,
        body: message.body,
        isStaff: message.isStaff,
        createdAt: message.createdAt.toISOString(),
        authorName: message.user.name,
        authorId: message.user.id
      }))
    } satisfies SupportTicketDetailDto;
  });

'use server';

import { revalidatePath } from 'next/cache';

import { pageActionClient } from '@/actions/safe-action';
import { Routes } from '@/constants/routes';
import { feedClusterFromResolution } from '@/lib/desk/feed-cluster';
import { prisma } from '@/lib/db/prisma';
import { NotFoundError } from '@/lib/validation/exceptions';
import { updateHandoffTicketStatusSchema } from '@/schemas/handoff/human-desk-schema';

export const updateHandoffTicketStatus = pageActionClient('desk')
  .metadata({ actionName: 'updateHandoffTicketStatus' })
  .schema(updateHandoffTicketStatusSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const ticket = await prisma.handoffTicket.findFirst({
      where: {
        id: parsedInput.id,
        organizationId: session.user.organizationId
      },
      select: {
        id: true,
        conversationId: true,
        subject: true,
        summary: true,
        whySummary: true,
        howSummary: true,
        clusterId: true
      }
    });
    if (!ticket) {
      throw new NotFoundError('Ticket not found');
    }

    const isResolving =
      parsedInput.status === 'RESOLVED' || parsedInput.status === 'CLOSED';

    await prisma.$transaction([
      prisma.handoffTicket.update({
        where: { id: ticket.id },
        data: {
          status: parsedInput.status,
          ...(isResolving ? { resolvedAt: new Date() } : {})
        }
      }),
      ...(ticket.conversationId && isResolving
        ? [
            prisma.conversation.update({
              where: { id: ticket.conversationId },
              data: { resolved: true }
            })
          ]
        : [])
    ]);

    if (
      isResolving &&
      parsedInput.feedCluster !== false &&
      parsedInput.resolutionSolution?.trim()
    ) {
      await feedClusterFromResolution({
        organizationId: session.user.organizationId,
        ticketId: ticket.id,
        pattern:
          parsedInput.resolutionPattern?.trim() ||
          ticket.subject,
        issueType:
          parsedInput.issueType?.trim() || 'general',
        solution: parsedInput.resolutionSolution.trim(),
        existingClusterId: ticket.clusterId
      });
    }

    revalidatePath(Routes.Desk);
    revalidatePath(Routes.DeskHuman);
    revalidatePath(Routes.DeskClusters);
    revalidatePath(Routes.DeskAI);
    revalidatePath(Routes.History);
  });

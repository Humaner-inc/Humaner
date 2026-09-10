'use server';

import { revalidatePath } from 'next/cache';

import { pageActionClientAny } from '@/actions/safe-action';
import { Routes } from '@/constants/routes';
import { prisma } from '@/lib/db/prisma';
import { feedClusterFromResolution } from '@/lib/desk/feed-cluster';
import { notifyTicketResolved } from '@/lib/desk/notify-ticket-resolved';
import { extractResolutionPattern } from '@/lib/platform-intelligence/extract-resolution-pattern';
import { publishOrgEvent } from '@/lib/realtime/org-events';
import { NotFoundError } from '@/lib/validation/exceptions';
import { updateHandoffTicketStatusSchema } from '@/schemas/handoff/human-desk-schema';

export const updateHandoffTicketStatus = pageActionClientAny('desk', 'tasks')
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
        agentId: true,
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

    const resolverName = session.user.name || 'Team member';

    await prisma.$transaction([
      prisma.handoffTicket.update({
        where: { id: ticket.id },
        data: {
          status: parsedInput.status,
          ...(isResolving
            ? {
                resolvedAt: new Date(),
                resolvedBy: 'human',
                resolvedByName: resolverName
              }
            : {})
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
        pattern: parsedInput.resolutionPattern?.trim() || ticket.subject,
        issueType: parsedInput.issueType?.trim() || 'general',
        solution: parsedInput.resolutionSolution.trim(),
        existingClusterId: ticket.clusterId
      });

      await extractResolutionPattern({
        organizationId: session.user.organizationId,
        agentId: ticket.agentId,
        issueType: parsedInput.issueType?.trim() || 'general',
        solution: parsedInput.resolutionSolution.trim()
      });
    }

    if (isResolving) {
      await notifyTicketResolved({
        ticketId: ticket.id,
        organizationId: session.user.organizationId,
        resolvedBy: 'human',
        resolvedByName: resolverName,
        resolutionSolution: parsedInput.resolutionSolution?.trim(),
        sendEmail: parsedInput.sendSolutionEmail !== false
      });
    }

    void publishOrgEvent(session.user.organizationId, {
      type: 'ticket.updated',
      resourceId: ticket.id,
      actorId: session.user.id,
      actorName: session.user.name
    });

    revalidatePath(Routes.Desk);
    revalidatePath(Routes.DeskHuman);
    revalidatePath(Routes.DeskClusters);
    revalidatePath(Routes.DeskAgent);
    revalidatePath(Routes.History);
    revalidatePath(Routes.Tasks);
  });

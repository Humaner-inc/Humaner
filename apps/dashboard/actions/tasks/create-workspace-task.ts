'use server';

import { revalidatePath } from 'next/cache';

import { pageActionClient } from '@/actions/safe-action';
import { Routes } from '@/constants/routes';
import { requireOrganizationCapability } from '@/lib/billing/capabilities';
import { prisma } from '@/lib/db/prisma';
import { createHandoffTicketWithNumber } from '@/lib/desk/allocate-ticket-number';
import { publishOrgEvent } from '@/lib/realtime/org-events';
import { NotFoundError, PreConditionError } from '@/lib/validation/exceptions';
import { createWorkspaceTaskSchema } from '@/schemas/tasks/create-workspace-task-schema';

export const createWorkspaceTask = pageActionClient('tasks')
  .metadata({ actionName: 'createWorkspaceTask' })
  .schema(createWorkspaceTaskSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const organizationId = session.user.organizationId;
    await requireOrganizationCapability(
      organizationId,
      'tasks',
      'Tasks are included on Inbox. Upgrade to create and manage tasks.'
    );

    const agent = await prisma.agent.findFirst({
      where: { organizationId },
      select: { id: true },
      orderBy: { createdAt: 'asc' }
    });

    if (!agent) {
      throw new PreConditionError(
        'This workspace has no agent to attach tasks to yet.'
      );
    }

    if (parsedInput.assigneeId) {
      const membership = await prisma.organizationMembership.findFirst({
        where: {
          userId: parsedInput.assigneeId,
          organizationId
        },
        select: { id: true }
      });
      if (!membership) {
        throw new NotFoundError('Teammate not found');
      }
    }

    const subject = parsedInput.subject.trim();
    const summary = parsedInput.summary?.trim() || subject;

    const ticket = await createHandoffTicketWithNumber({
      organizationId,
      agentId: agent.id,
      subject,
      summary,
      transcript: '',
      source: 'EMAIL',
      status: 'OPEN',
      urgency: parsedInput.urgency ?? 'MEDIUM',
      routedTo: 'HUMAN',
      assigneeId: parsedInput.assigneeId,
      assignedAt: parsedInput.assigneeId ? new Date() : null
    });

    void publishOrgEvent(organizationId, {
      type: 'ticket.updated',
      resourceId: ticket.id,
      actorId: session.user.id,
      actorName: session.user.name
    });

    revalidatePath(Routes.Tasks);
    revalidatePath(Routes.InboxAssigned);
    return ticket;
  });

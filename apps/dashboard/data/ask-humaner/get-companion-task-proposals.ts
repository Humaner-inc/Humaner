import 'server-only';

import { cache } from 'react';

import { collectCompanionTaskProposals } from '@/lib/ask-humaner/companion-task-proposals';
import { dedupedAuth } from '@/lib/auth';
import { userCanAccessDashboardPage } from '@/lib/auth/require-workspace-access';
import { checkSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { isOssDeployment } from '@/lib/deployment-mode';
import type { CompanionTaskProposal } from '@/types/companion-task-proposal';
import type { DashboardNotification } from '@/types/dashboard-notification';

function endOfLocalDay(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
}

export const getCompanionTaskProposals = cache(
  async (
    notifications: DashboardNotification[]
  ): Promise<CompanionTaskProposal[]> => {
    const session = await dedupedAuth();
    if (!checkSession(session)) return [];

    const organizationId = session.user.organizationId;
    const userId = session.user.id;
    if (!organizationId) return [];

    const now = new Date();
    const oss = isOssDeployment();
    const [canTasks, canCalendar] = await Promise.all([
      userCanAccessDashboardPage(userId, 'tasks'),
      userCanAccessDashboardPage(userId, 'calendar')
    ]);

    const [tasks, events] = await Promise.all([
      canTasks
        ? prisma.handoffTicket.findMany({
            where: {
              organizationId,
              assigneeId: userId,
              status: { in: ['OPEN', 'IN_PROGRESS'] }
            },
            orderBy: { updatedAt: 'desc' },
            take: 6,
            select: {
              id: true,
              ticketNumber: true,
              subject: true,
              status: true,
              updatedAt: true
            }
          })
        : Promise.resolve([]),
      canCalendar
        ? prisma.calendarEvent.findMany({
            where: {
              organizationId,
              startsAt: { lt: endOfLocalDay(now) },
              endsAt: { gt: now },
              OR: [{ createdById: userId }, { attendees: { some: { userId } } }]
            },
            orderBy: { startsAt: 'asc' },
            take: 5,
            select: {
              id: true,
              title: true,
              startsAt: true
            }
          })
        : Promise.resolve([])
    ]);

    const workspaceNotifications = oss
      ? notifications.filter((item) => item.kind !== 'mail')
      : notifications;
    const liveNotifications = workspaceNotifications.filter(
      (item) => !item.id.startsWith('demo-')
    );
    const actionableNotifications = liveNotifications.filter(
      (item) =>
        item.kind === 'mail' ||
        item.kind === 'mention' ||
        item.kind === 'task' ||
        item.kind === 'ticket'
    );
    const hasWorkspaceWork =
      tasks.length > 0 ||
      events.length > 0 ||
      actionableNotifications.length > 0;

    if (!hasWorkspaceWork) {
      return [];
    }

    return collectCompanionTaskProposals(
      {
        notifications: actionableNotifications,
        tasks: tasks.map((task) => ({
          id: task.id,
          ticketNumber: task.ticketNumber,
          subject: task.subject,
          status: task.status,
          updatedAt: task.updatedAt.toISOString()
        })),
        events: events.map((event) => ({
          id: event.id,
          title: event.title,
          startsAt: event.startsAt.toISOString()
        }))
      },
      { now }
    );
  }
);

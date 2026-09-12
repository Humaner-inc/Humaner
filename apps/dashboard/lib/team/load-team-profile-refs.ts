import 'server-only';

import { prisma } from '@/lib/db/prisma';
import type { TeamProfileRef } from '@/lib/desk/routing-types';

export type TeamMemberLoad = {
  userId: string;
  assigned: number;
};

export async function loadAssignedWorkByUser(
  organizationId: string
): Promise<Map<string, number>> {
  const [mailCounts, taskCounts] = await Promise.all([
    prisma.mailThread.groupBy({
      by: ['assigneeId'],
      where: {
        organizationId,
        assigneeId: { not: null },
        assigneeKind: 'HUMAN',
        archivedAt: null,
        status: { in: ['OPEN', 'PENDING'] }
      },
      _count: { id: true }
    }),
    prisma.handoffTicket.groupBy({
      by: ['assigneeId'],
      where: {
        organizationId,
        assigneeId: { not: null },
        status: { in: ['OPEN', 'IN_PROGRESS'] }
      },
      _count: { id: true }
    })
  ]);

  const loadByUser = new Map<string, number>();
  for (const row of [...mailCounts, ...taskCounts]) {
    if (!row.assigneeId) continue;
    loadByUser.set(
      row.assigneeId,
      (loadByUser.get(row.assigneeId) ?? 0) + row._count.id
    );
  }
  return loadByUser;
}

export async function loadTeamProfileRefs(
  organizationId: string
): Promise<TeamProfileRef[]> {
  const [profiles, loadByUser] = await Promise.all([
    prisma.teamMemberProfile.findMany({
      where: { organizationId },
      select: {
        userId: true,
        knowledgeAreas: true,
        maxConcurrent: true
      }
    }),
    loadAssignedWorkByUser(organizationId)
  ]);

  return profiles.map((profile) => ({
    userId: profile.userId,
    knowledgeAreas: profile.knowledgeAreas.map((area) => area.toLowerCase()),
    currentTickets: loadByUser.get(profile.userId) ?? 0,
    maxConcurrent: profile.maxConcurrent
  }));
}

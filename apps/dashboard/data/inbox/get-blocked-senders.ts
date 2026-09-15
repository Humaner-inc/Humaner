import 'server-only';

import { dedupedAuth } from '@/lib/auth';
import { userCanAccessDashboardPage } from '@/lib/auth/require-workspace-access';
import { checkSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

export type BlockedSenderItem = {
  email: string;
  createdAt: string;
};

export async function getBlockedSenders(): Promise<BlockedSenderItem[]> {
  const session = await dedupedAuth();
  if (!checkSession(session)) return [];
  if (!(await userCanAccessDashboardPage(session.user.id, 'inbox'))) {
    return [];
  }

  const organizationId = session.user.organizationId;
  if (!organizationId) return [];

  const rows = await prisma.mailBlockedSender.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'desc' },
    select: { email: true, createdAt: true }
  });

  return rows.map((row) => ({
    email: row.email,
    createdAt: row.createdAt.toISOString()
  }));
}

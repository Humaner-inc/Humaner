import { dedupedAuth } from '@/lib/auth';
import { isAdmin } from '@/lib/auth/permissions';
import { prisma } from '@/lib/db/prisma';
import { sortSupportTicketsInboxOrder } from '@/lib/support-ticket-labels';
import { ForbiddenError } from '@/lib/validation/exceptions';

export type AdminSupportTicketListRow = {
  id: string;
  title: string;
  status: string;
  contextTab: string;
  contextFeature: string | null;
  updatedAt: Date;
  createdAt: Date;
  messageCount: number;
  requesterName: string;
  requesterEmail: string | null;
};

export async function getAdminSupportTicketsList(): Promise<
  AdminSupportTicketListRow[]
> {
  const session = await dedupedAuth();
  if (!session?.user?.id || !(await isAdmin(session.user.id))) {
    throw new ForbiddenError('Admin access required');
  }

  const rows = await prisma.supportTicket.findMany({
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      title: true,
      status: true,
      contextTab: true,
      contextFeature: true,
      updatedAt: true,
      createdAt: true,
      user: { select: { name: true, email: true } },
      _count: { select: { messages: true } }
    }
  });

  const mapped = rows.map((row) => ({
    id: row.id,
    title: row.title,
    status: row.status,
    contextTab: row.contextTab,
    contextFeature: row.contextFeature,
    updatedAt: row.updatedAt,
    createdAt: row.createdAt,
    messageCount: row._count.messages,
    requesterName: row.user.name,
    requesterEmail: row.user.email
  }));

  return sortSupportTicketsInboxOrder(mapped);
}

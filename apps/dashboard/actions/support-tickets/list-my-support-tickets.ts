'use server';

import { authActionClient } from '@/actions/safe-action';
import { prisma } from '@/lib/db/prisma';
import { sortSupportTicketsInboxOrder } from '@/lib/support-ticket-labels';
import { z } from 'zod';

export type MySupportTicketListRow = {
  id: string;
  title: string;
  status: string;
  contextTab: string;
  contextFeature: string | null;
  updatedAt: string;
  createdAt: string;
  messageCount: number;
};

export const listMySupportTickets = authActionClient
  .metadata({ actionName: 'listMySupportTickets' })
  .schema(z.object({}))
  .action(async ({ ctx: { session } }) => {
    const rows = await prisma.supportTicket.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        status: true,
        contextTab: true,
        contextFeature: true,
        updatedAt: true,
        createdAt: true,
        _count: { select: { messages: true } }
      }
    });

    const mapped = rows.map((row) => ({
      id: row.id,
      title: row.title,
      status: row.status,
      contextTab: row.contextTab,
      contextFeature: row.contextFeature,
      updatedAt: row.updatedAt.toISOString(),
      createdAt: row.createdAt.toISOString(),
      messageCount: row._count.messages
    }));

    return sortSupportTicketsInboxOrder(
      mapped.map((row) => ({
        ...row,
        updatedAt: new Date(row.updatedAt)
      }))
    ).map((row) => ({
      ...row,
      updatedAt: row.updatedAt.toISOString()
    })) satisfies MySupportTicketListRow[];
  });

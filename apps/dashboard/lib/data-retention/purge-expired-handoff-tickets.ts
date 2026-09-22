import 'server-only';

import { subDays } from 'date-fns';

import { getMessageRetentionDays } from '@/lib/data-retention/constants';
import { prisma } from '@/lib/db/prisma';

export type PurgeExpiredTicketsResult = {
  ticketsDeleted: number;
  retentionDays: number;
  cutoff: string;
};

export async function purgeExpiredHandoffTickets(): Promise<PurgeExpiredTicketsResult> {
  const retentionDays = getMessageRetentionDays();
  const cutoff = subDays(new Date(), retentionDays);

  const tickets = await prisma.handoffTicket.findMany({
    where: {
      updatedAt: { lt: cutoff },
      status: { in: ['RESOLVED', 'CLOSED'] }
    },
    select: { id: true }
  });
  for (const ticket of tickets) {
    await prisma.handoffTicket.delete({ where: { id: ticket.id } });
  }

  return {
    ticketsDeleted: tickets.length,
    retentionDays,
    cutoff: cutoff.toISOString()
  };
}

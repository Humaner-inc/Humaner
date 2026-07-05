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

  const deleted = await prisma.handoffTicket.deleteMany({
    where: {
      updatedAt: { lt: cutoff },
      status: { in: ['RESOLVED', 'CLOSED'] }
    }
  });

  return {
    ticketsDeleted: deleted.count,
    retentionDays,
    cutoff: cutoff.toISOString()
  };
}

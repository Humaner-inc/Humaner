import 'server-only';

import { prisma } from '@/lib/db/prisma';

type TicketNumberTx = Pick<typeof prisma, 'handoffTicket'>;

/**
 * Allocate the next org-scoped ticket number.
 * Must be called inside a Prisma interactive transaction to avoid races.
 */
export async function allocateTicketNumber(
  tx: TicketNumberTx,
  organizationId: string
): Promise<number> {
  const result = await tx.handoffTicket.aggregate({
    where: { organizationId },
    _max: { ticketNumber: true }
  });

  return (result._max.ticketNumber ?? 0) + 1;
}

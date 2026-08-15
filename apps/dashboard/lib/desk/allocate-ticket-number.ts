import 'server-only';

import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/db/prisma';

const MAX_ATTEMPTS = 5;

type HandoffTicketData = Omit<
  Prisma.HandoffTicketUncheckedCreateInput,
  'ticketNumber'
> & { organizationId: string };

function isTicketNumberCollision(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}

/**
 * Create a handoff ticket with the next org-scoped ticket number.
 * Rather than lock the table on every handoff, retry the allocation.
 * Collisions are rare and each retry re-reads a committed maximum.
 */
export async function createHandoffTicketWithNumber(
  data: HandoffTicketData
): Promise<{ id: string; ticketNumber: number }> {
  for (let attempt = 1; ; attempt++) {
    const { _max } = await prisma.handoffTicket.aggregate({
      where: { organizationId: data.organizationId },
      _max: { ticketNumber: true }
    });

    try {
      return await prisma.handoffTicket.create({
        data: { ...data, ticketNumber: (_max.ticketNumber ?? 0) + 1 },
        select: { id: true, ticketNumber: true }
      });
    } catch (error) {
      if (attempt >= MAX_ATTEMPTS || !isTicketNumberCollision(error)) {
        throw error;
      }
    }
  }
}

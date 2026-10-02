import 'server-only';

import { prisma } from '@/lib/db/prisma';

function isUniqueConstraint(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'P2002'
  );
}

type CreateCalendarEventRowInput = {
  organizationId: string;
  createdById: string;
  title: string;
  description?: string | null;
  startsAt: Date;
  endsAt: Date;
  allDay?: boolean;
  color?: string;
  source: string;
  sourceKey?: string | null;
  attendeeIds?: string[];
};

/**
 * Insert a local calendar row. If Google import raced and already stored the
 * same sourceKey, attach to that row instead of failing.
 */
export async function createCalendarEventRow(
  input: CreateCalendarEventRowInput
): Promise<{ id: string }> {
  const attendeeIds = input.attendeeIds?.length
    ? [...new Set(input.attendeeIds)]
    : [];

  try {
    return await prisma.calendarEvent.create({
      data: {
        organizationId: input.organizationId,
        createdById: input.createdById,
        title: input.title,
        description: input.description ?? null,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        allDay: input.allDay ?? false,
        color: input.color,
        source: input.source,
        sourceKey: input.sourceKey ?? null,
        attendees: attendeeIds.length
          ? { create: attendeeIds.map((userId) => ({ userId })) }
          : undefined
      },
      select: { id: true }
    });
  } catch (error) {
    if (!isUniqueConstraint(error) || !input.sourceKey) {
      throw error;
    }

    const existing = await prisma.calendarEvent.findFirst({
      where: {
        organizationId: input.organizationId,
        sourceKey: input.sourceKey
      },
      select: { id: true }
    });
    if (!existing) throw error;

    await prisma.calendarEvent.update({
      where: { id: existing.id },
      data: {
        title: input.title,
        description: input.description ?? null,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        allDay: input.allDay ?? false,
        ...(input.color ? { color: input.color } : {}),
        source: input.source
      }
    });

    if (attendeeIds.length > 0) {
      for (const userId of attendeeIds) {
        await prisma.calendarEventAttendee.upsert({
          where: {
            eventId_userId: { eventId: existing.id, userId }
          },
          create: { eventId: existing.id, userId },
          update: {}
        });
      }
    }

    return existing;
  }
}

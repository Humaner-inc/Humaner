'use server';

import { revalidatePath } from 'next/cache';

import { pageActionClient } from '@/actions/safe-action';
import { Routes } from '@/constants/routes';
import { prisma } from '@/lib/db/prisma';
import { NotFoundError, PreConditionError } from '@/lib/validation/exceptions';
import { updateCalendarEventSchema } from '@/schemas/calendar/update-calendar-event-schema';

export const updateCalendarEvent = pageActionClient('calendar')
  .metadata({ actionName: 'updateCalendarEvent' })
  .schema(updateCalendarEventSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const organizationId = session.user.organizationId;
    const existing = await prisma.calendarEvent.findFirst({
      where: { id: parsedInput.id, organizationId },
      select: { id: true, startsAt: true, endsAt: true }
    });

    if (!existing) {
      throw new NotFoundError('Event not found');
    }

    const startsAt = parsedInput.startsAt ?? existing.startsAt;
    const endsAt = parsedInput.endsAt ?? existing.endsAt;
    if (endsAt <= startsAt) {
      throw new PreConditionError('End time must be after start time.');
    }

    if (parsedInput.attendeeIds) {
      const attendeeIds = [...new Set(parsedInput.attendeeIds)];
      if (attendeeIds.length > 0) {
        const members = await prisma.organizationMembership.count({
          where: {
            organizationId,
            userId: { in: attendeeIds }
          }
        });
        if (members !== attendeeIds.length) {
          throw new NotFoundError('Teammate not found');
        }
      }

      await prisma.$transaction([
        prisma.calendarEventAttendee.deleteMany({
          where: { eventId: existing.id }
        }),
        prisma.calendarEvent.update({
          where: { id: existing.id },
          data: {
            title: parsedInput.title,
            description: parsedInput.description,
            startsAt,
            endsAt,
            attendees:
              attendeeIds.length > 0
                ? { create: attendeeIds.map((userId) => ({ userId })) }
                : undefined
          }
        })
      ]);
    } else {
      await prisma.calendarEvent.update({
        where: { id: existing.id },
        data: {
          title: parsedInput.title,
          description: parsedInput.description,
          startsAt,
          endsAt
        }
      });
    }

    revalidatePath(Routes.Calendar);
    return { id: existing.id };
  });

'use server';

import { revalidatePath } from 'next/cache';

import { pageActionClient } from '@/actions/safe-action';
import { Routes } from '@/constants/routes';
import { notifyCalendarAttendees } from '@/lib/calendar/notify-attendees';
import { prisma } from '@/lib/db/prisma';
import { NotFoundError } from '@/lib/validation/exceptions';
import { createCalendarEventSchema } from '@/schemas/calendar/create-calendar-event-schema';

export const createCalendarEvent = pageActionClient('calendar')
  .metadata({ actionName: 'createCalendarEvent' })
  .schema(createCalendarEventSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const organizationId = session.user.organizationId;
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

    const event = await prisma.calendarEvent.create({
      data: {
        organizationId,
        createdById: session.user.id,
        title: parsedInput.title,
        description: parsedInput.description,
        startsAt: parsedInput.startsAt,
        endsAt: parsedInput.endsAt,
        color: parsedInput.color ?? '#f85919',
        attendees: attendeeIds.length
          ? {
              create: attendeeIds.map((userId) => ({ userId }))
            }
          : undefined
      },
      select: { id: true }
    });

    await notifyCalendarAttendees({
      authorId: session.user.id,
      authorName: session.user.name ?? 'A teammate',
      eventId: event.id,
      title: parsedInput.title,
      startsAt: parsedInput.startsAt,
      attendeeIds
    });

    revalidatePath(Routes.Calendar);
    revalidatePath(Routes.Overview);
    return { id: event.id };
  });

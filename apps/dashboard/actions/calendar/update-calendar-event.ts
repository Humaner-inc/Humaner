'use server';

import { revalidatePath } from 'next/cache';

import { pageActionClient } from '@/actions/safe-action';
import { Routes } from '@/constants/routes';
import { notifyCalendarAttendees } from '@/lib/calendar/notify-attendees';
import {
  pushCalendarEventToGoogle,
  shouldSyncSourceKeyToGoogle
} from '@/lib/calendar/push-event-to-google';
import { prisma } from '@/lib/db/prisma';
import {
  NotFoundError,
  PreConditionError,
  ValidationError
} from '@/lib/validation/exceptions';
import { updateCalendarEventSchema } from '@/schemas/calendar/update-calendar-event-schema';

export const updateCalendarEvent = pageActionClient('calendar')
  .metadata({ actionName: 'updateCalendarEvent' })
  .schema(updateCalendarEventSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const organizationId = session.user.organizationId;
    const existing = await prisma.calendarEvent.findFirst({
      where: { id: parsedInput.id, organizationId },
      select: {
        id: true,
        title: true,
        description: true,
        startsAt: true,
        endsAt: true,
        allDay: true,
        sourceKey: true,
        attendees: { select: { userId: true } }
      }
    });

    if (!existing) {
      throw new NotFoundError('Event not found');
    }

    const title = parsedInput.title ?? existing.title;
    const description =
      parsedInput.description !== undefined
        ? parsedInput.description
        : existing.description;
    const startsAt = parsedInput.startsAt ?? existing.startsAt;
    const endsAt = parsedInput.endsAt ?? existing.endsAt;
    if (endsAt <= startsAt) {
      throw new PreConditionError('End time must be after start time.');
    }

    let sourceKey = existing.sourceKey;
    if (shouldSyncSourceKeyToGoogle(existing.sourceKey)) {
      try {
        const user = await prisma.user.findFirst({
          where: { id: session.user.id },
          select: { timeZone: true }
        });
        const pushed = await pushCalendarEventToGoogle({
          organizationId,
          title,
          description,
          startsAt,
          endsAt,
          allDay: existing.allDay,
          sourceKey: existing.sourceKey,
          timeZone: user?.timeZone
        });
        if (pushed) {
          sourceKey = pushed;
        }
      } catch (error) {
        throw new ValidationError(
          error instanceof Error
            ? error.message
            : 'Could not update this event in Google Calendar.'
        );
      }
    }

    const previousAttendeeIds = existing.attendees.map(
      (attendee) => attendee.userId
    );

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

      await prisma.$transaction(async (tx) => {
        const attendees = await tx.calendarEventAttendee.findMany({
          where: { eventId: existing.id },
          select: { id: true }
        });
        for (const attendee of attendees) {
          await tx.calendarEventAttendee.delete({ where: { id: attendee.id } });
        }
        await tx.calendarEvent.update({
          where: { id: existing.id },
          data: {
            title: parsedInput.title,
            description: parsedInput.description,
            startsAt,
            endsAt,
            color: parsedInput.color,
            sourceKey,
            attendees:
              attendeeIds.length > 0
                ? { create: attendeeIds.map((userId) => ({ userId })) }
                : undefined
          }
        });
      });

      await notifyCalendarAttendees({
        authorId: session.user.id,
        authorName: session.user.name ?? 'A teammate',
        eventId: existing.id,
        title,
        startsAt,
        attendeeIds,
        previousAttendeeIds
      });
    } else {
      await prisma.calendarEvent.update({
        where: { id: existing.id },
        data: {
          title: parsedInput.title,
          description: parsedInput.description,
          startsAt,
          endsAt,
          color: parsedInput.color,
          sourceKey
        }
      });
    }

    revalidatePath(Routes.Calendar);
    revalidatePath(Routes.Overview);
    return {
      id: existing.id,
      syncedToGoogle: Boolean(sourceKey?.startsWith('google:'))
    };
  });

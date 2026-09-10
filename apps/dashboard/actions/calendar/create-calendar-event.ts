'use server';

import { revalidatePath } from 'next/cache';

import { pageActionClient } from '@/actions/safe-action';
import { Routes } from '@/constants/routes';
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
        attendees: attendeeIds.length
          ? {
              create: attendeeIds.map((userId) => ({ userId }))
            }
          : undefined
      },
      select: { id: true }
    });

    revalidatePath(Routes.Calendar);
    return { id: event.id };
  });

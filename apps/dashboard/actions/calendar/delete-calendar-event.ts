'use server';

import { revalidatePath } from 'next/cache';

import { pageActionClient } from '@/actions/safe-action';
import { Routes } from '@/constants/routes';
import { deleteCalendarEventFromGoogle } from '@/lib/calendar/push-event-to-google';
import { prisma } from '@/lib/db/prisma';
import { NotFoundError, ValidationError } from '@/lib/validation/exceptions';
import { deleteCalendarEventSchema } from '@/schemas/calendar/delete-calendar-event-schema';

export const deleteCalendarEvent = pageActionClient('calendar')
  .metadata({ actionName: 'deleteCalendarEvent' })
  .schema(deleteCalendarEventSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const existing = await prisma.calendarEvent.findFirst({
      where: {
        id: parsedInput.id,
        organizationId: session.user.organizationId
      },
      select: { id: true, sourceKey: true }
    });

    if (!existing) {
      throw new NotFoundError('Event not found');
    }

    try {
      await deleteCalendarEventFromGoogle({
        organizationId: session.user.organizationId,
        sourceKey: existing.sourceKey
      });
    } catch (error) {
      throw new ValidationError(
        error instanceof Error
          ? error.message
          : 'Could not delete this event from Google Calendar.'
      );
    }

    await prisma.calendarEvent.delete({ where: { id: existing.id } });
    revalidatePath(Routes.Calendar);
    revalidatePath(Routes.Overview);
    return { id: existing.id };
  });

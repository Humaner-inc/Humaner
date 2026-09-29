import 'server-only';

import { Routes } from '@/constants/routes';
import { formatCalendarDateParam } from '@/lib/calendar/calendar-view';
import { prisma } from '@/lib/db/prisma';

export async function notifyCalendarAttendees(input: {
  authorId: string;
  authorName: string;
  eventId: string;
  title: string;
  startsAt: Date;
  attendeeIds: string[];
  /** When updating, only notify newly added teammates. */
  previousAttendeeIds?: string[];
}): Promise<void> {
  const previous = new Set(input.previousAttendeeIds ?? []);
  const recipients = [...new Set(input.attendeeIds)].filter(
    (userId) => userId !== input.authorId && !previous.has(userId)
  );
  if (recipients.length === 0) return;

  const when = input.startsAt.toLocaleString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
  const link = `${Routes.Calendar}?date=${formatCalendarDateParam(input.startsAt)}&event=${input.eventId}`;

  await prisma.notification.createMany({
    data: recipients.map((userId) => ({
      userId,
      subject: 'Calendar invite',
      content: `${input.authorName} added you to “${input.title}” · ${when}`,
      link
    }))
  });
}

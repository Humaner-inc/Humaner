import 'server-only';

import { extractMeetingsFromMail } from '@/services/calendar/extract-meetings-from-mail';
import { MailMessageDirection } from '@prisma/client';

import { prisma } from '@/lib/db/prisma';

export async function ingestMailMessageForCalendar(input: {
  organizationId: string;
  threadId: string;
  subject: string;
  bodyText?: string | null;
  bodyHtml?: string | null;
}): Promise<number> {
  const organization = await prisma.organization.findFirst({
    where: { id: input.organizationId },
    select: {
      calendarMailAutomation: true,
      ownerId: true,
      memberships: {
        select: { userId: true },
        orderBy: { createdAt: 'asc' },
        take: 1
      }
    }
  });
  if (!organization?.calendarMailAutomation) {
    return 0;
  }

  const createdById =
    organization.ownerId ?? organization.memberships[0]?.userId;
  if (!createdById) {
    return 0;
  }

  const meetings = extractMeetingsFromMail(input);
  let created = 0;
  for (const meeting of meetings) {
    const existing = await prisma.calendarEvent.findFirst({
      where: {
        organizationId: input.organizationId,
        sourceKey: meeting.sourceKey
      },
      select: { id: true }
    });
    if (existing) continue;

    await prisma.calendarEvent.create({
      data: {
        organizationId: input.organizationId,
        createdById,
        title: meeting.title,
        description: `Added from inbox thread ${input.threadId}`,
        startsAt: meeting.startsAt,
        endsAt: meeting.endsAt,
        source: 'mail',
        sourceKey: meeting.sourceKey
      }
    });
    created += 1;
  }

  return created;
}

export function scheduleMailCalendarIngest(input: {
  organizationId: string;
  threadId: string;
  subject: string;
  bodyText?: string | null;
  bodyHtml?: string | null;
}): void {
  void ingestMailMessageForCalendar(input).catch(() => undefined);
}

export async function backfillMailCalendarEvents(input: {
  organizationId: string;
  createdById: string;
}): Promise<number> {
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const messages = await prisma.mailMessage.findMany({
    where: {
      direction: MailMessageDirection.INBOUND,
      sentAt: { gte: since },
      thread: { organizationId: input.organizationId }
    },
    select: {
      bodyText: true,
      bodyHtml: true,
      thread: { select: { id: true, subject: true } }
    },
    orderBy: { sentAt: 'desc' },
    take: 80
  });

  let created = 0;
  for (const message of messages) {
    created += await ingestMailMessageForCalendar({
      organizationId: input.organizationId,
      threadId: message.thread.id,
      subject: message.thread.subject,
      bodyText: message.bodyText,
      bodyHtml: message.bodyHtml
    });
  }

  return created;
}

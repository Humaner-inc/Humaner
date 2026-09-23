import 'server-only';

import { extractMeetingsFromMail } from '@/services/calendar/extract-meetings-from-mail';
import { MailMessageDirection } from '@prisma/client';

import { prisma } from '@/lib/db/prisma';

type MailCalendarInput = {
  organizationId: string;
  threadId: string;
  subject: string;
  bodyText?: string | null;
  bodyHtml?: string | null;
  sentAt?: Date | null;
};

type IngestContext = {
  createdById: string;
  timeZone: string | null;
};

const CATCH_UP_INTERVAL_MS = 5 * 60 * 1000;
const lastCatchUpAt = new Map<string, number>();

function isUniqueConstraint(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'P2002'
  );
}

async function loadIngestContext(
  organizationId: string
): Promise<IngestContext | null> {
  const organization = await prisma.organization.findFirst({
    where: { id: organizationId },
    select: {
      calendarMailAutomation: true,
      ownerId: true,
      owner: { select: { timeZone: true } },
      memberships: {
        select: {
          userId: true,
          user: { select: { timeZone: true } }
        },
        orderBy: { createdAt: 'asc' },
        take: 1
      }
    }
  });
  if (!organization?.calendarMailAutomation) {
    return null;
  }

  const createdById =
    organization.ownerId ?? organization.memberships[0]?.userId;
  if (!createdById) {
    return null;
  }

  return {
    createdById,
    timeZone:
      organization.owner?.timeZone ??
      organization.memberships[0]?.user.timeZone ??
      null
  };
}

async function createExtractedMeetings(
  context: IngestContext,
  input: MailCalendarInput
): Promise<number> {
  const meetings = extractMeetingsFromMail({
    ...input,
    timeZone: context.timeZone
  });
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

    try {
      await prisma.calendarEvent.create({
        data: {
          organizationId: input.organizationId,
          createdById: context.createdById,
          title: meeting.title,
          description: `Added from inbox thread ${input.threadId}`,
          startsAt: meeting.startsAt,
          endsAt: meeting.endsAt,
          source: 'mail',
          sourceKey: meeting.sourceKey
        }
      });
      created += 1;
    } catch (error) {
      if (!isUniqueConstraint(error)) {
        throw error;
      }
    }
  }

  return created;
}

export async function ingestMailMessageForCalendar(
  input: MailCalendarInput
): Promise<number> {
  const context = await loadIngestContext(input.organizationId);
  if (!context) {
    return 0;
  }
  return createExtractedMeetings(context, input);
}

export function scheduleMailCalendarIngest(input: MailCalendarInput): void {
  void ingestMailMessageForCalendar(input).catch(() => undefined);
}

export async function backfillMailCalendarEvents(input: {
  organizationId: string;
  createdById: string;
}): Promise<number> {
  const context = await loadIngestContext(input.organizationId);
  if (!context) {
    return 0;
  }

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
      sentAt: true,
      thread: { select: { id: true, subject: true } }
    },
    orderBy: { sentAt: 'desc' },
    take: 80
  });

  let created = 0;
  for (const message of messages) {
    created += await createExtractedMeetings(context, {
      organizationId: input.organizationId,
      threadId: message.thread.id,
      subject: message.thread.subject,
      bodyText: message.bodyText,
      bodyHtml: message.bodyHtml,
      sentAt: message.sentAt
    });
  }

  return created;
}

/** Re-read recent inbox mail so a confirmation that arrived before this parser still lands on the calendar. */
export async function catchUpMailCalendarEvents(input: {
  organizationId: string;
  createdById: string;
}): Promise<number> {
  const now = Date.now();
  const previous = lastCatchUpAt.get(input.organizationId) ?? 0;
  if (now - previous < CATCH_UP_INTERVAL_MS) {
    return 0;
  }
  lastCatchUpAt.set(input.organizationId, now);
  try {
    return await backfillMailCalendarEvents(input);
  } catch {
    lastCatchUpAt.delete(input.organizationId);
    return 0;
  }
}

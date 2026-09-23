import 'server-only';

import { redirect } from 'next/navigation';
import { catchUpMailCalendarEvents } from '@/services/calendar/ingest-mail-for-calendar';

import { dedupedAuth } from '@/lib/auth';
import { getLoginRedirect } from '@/lib/auth/redirect';
import { requireDashboardPageOrRedirect } from '@/lib/auth/require-workspace-access';
import { checkSession } from '@/lib/auth/session';
import {
  calendarRange,
  formatCalendarDateParam,
  parseCalendarDate,
  parseCalendarView,
  type CalendarView
} from '@/lib/calendar/calendar-view';
import { prisma } from '@/lib/db/prisma';
import type { WorkHoursDto } from '@/types/dtos/work-hours-dto';

export type CalendarTeamMember = {
  id: string;
  name: string;
  image: string | null;
  email: string | null;
};

export type CalendarEventItem = {
  id: string;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string;
  createdById: string;
  createdByName: string;
  attendeeIds: string[];
  source: string;
  color: string;
};

export type CalendarConnectionItem = {
  id: string;
  provider: 'GOOGLE' | 'CALENDLY' | 'OUTLOOK';
  accountEmail: string;
};

export type WorkspaceCalendarData = {
  events: CalendarEventItem[];
  teamMembers: CalendarTeamMember[];
  currentUserId: string;
  businessHours: WorkHoursDto[];
  rangeStart: string;
  rangeEnd: string;
  focusDate: string;
  view: CalendarView;
  mailAutomation: boolean;
  connections: CalendarConnectionItem[];
};

export async function getWorkspaceCalendarWeek(
  dateIso?: string,
  viewValue?: string
): Promise<WorkspaceCalendarData> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    return redirect(getLoginRedirect());
  }

  await requireDashboardPageOrRedirect('calendar');

  const organizationId = session.user.organizationId;
  const view = parseCalendarView(viewValue);
  const focus = parseCalendarDate(dateIso);
  const { start, end } = calendarRange(focus, view);

  const [events, memberships, organization, connections, createdFromMail] =
    await Promise.all([
      prisma.calendarEvent.findMany({
        where: {
          organizationId,
          startsAt: { lt: end },
          endsAt: { gt: start }
        },
        select: {
          id: true,
          title: true,
          description: true,
          startsAt: true,
          endsAt: true,
          color: true,
          createdById: true,
          source: true,
          createdBy: { select: { name: true } },
          attendees: { select: { userId: true } }
        },
        orderBy: { startsAt: 'asc' }
      }),
      prisma.organizationMembership.findMany({
        where: { organizationId },
        select: {
          user: {
            select: { id: true, name: true, image: true, email: true }
          }
        },
        orderBy: { createdAt: 'asc' }
      }),
      prisma.organization.findFirst({
        where: { id: organizationId },
        select: {
          calendarMailAutomation: true,
          businessHours: {
            select: {
              dayOfWeek: true,
              timeSlots: {
                select: { id: true, start: true, end: true }
              }
            }
          }
        }
      }),
      prisma.calendarConnection.findMany({
        where: { organizationId },
        select: { id: true, provider: true, accountEmail: true },
        orderBy: { createdAt: 'asc' }
      }),
      catchUpMailCalendarEvents({
        organizationId,
        createdById: session.user.id
      })
    ]);

  const visibleEvents =
    createdFromMail > 0
      ? await prisma.calendarEvent.findMany({
          where: {
            organizationId,
            startsAt: { lt: end },
            endsAt: { gt: start }
          },
          select: {
            id: true,
            title: true,
            description: true,
            startsAt: true,
            endsAt: true,
            color: true,
            createdById: true,
            source: true,
            createdBy: { select: { name: true } },
            attendees: { select: { userId: true } }
          },
          orderBy: { startsAt: 'asc' }
        })
      : events;

  const businessHours: WorkHoursDto[] = (organization?.businessHours ?? []).map(
    (workHours) => ({
      dayOfWeek: workHours.dayOfWeek,
      timeSlots: workHours.timeSlots.map((timeSlot) => ({
        id: timeSlot.id,
        start: timeSlot.start.toISOString(),
        end: timeSlot.end.toISOString()
      }))
    })
  );

  return {
    events: visibleEvents.map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      startsAt: event.startsAt.toISOString(),
      endsAt: event.endsAt.toISOString(),
      color: event.color,
      createdById: event.createdById,
      createdByName: event.createdBy.name,
      attendeeIds: event.attendees.map((attendee) => attendee.userId),
      source: event.source
    })),
    teamMembers: memberships.map((membership) => ({
      id: membership.user.id,
      name: membership.user.name,
      image: membership.user.image,
      email: membership.user.email
    })),
    currentUserId: session.user.id,
    businessHours,
    rangeStart: start.toISOString(),
    rangeEnd: end.toISOString(),
    focusDate: formatCalendarDateParam(focus),
    view,
    mailAutomation: organization?.calendarMailAutomation ?? false,
    connections: connections.map((connection) => ({
      id: connection.id,
      provider: connection.provider,
      accountEmail: connection.accountEmail
    }))
  };
}

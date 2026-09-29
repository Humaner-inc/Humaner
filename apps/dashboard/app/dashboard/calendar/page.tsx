import * as React from 'react';
import { connection } from 'next/server';

import { WorkspaceCalendarWeek } from '@/components/dashboard/calendar/workspace-calendar-week';
import { getWorkspaceCalendarWeek } from '@/data/calendar/get-workspace-calendar';
import { requireDashboardPageOrRedirect } from '@/lib/auth/require-workspace-access';

function CalendarFallback(): React.JSX.Element {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-4 px-6 py-5">
      <div className="h-8 w-40 animate-pulse bg-muted/40" />
      <div className="h-24 animate-pulse bg-muted/40" />
    </div>
  );
}

async function CalendarPageContent({
  searchParams
}: {
  searchParams: Promise<{
    week?: string;
    date?: string;
    view?: string;
    calendar?: string;
    event?: string;
  }>;
}): Promise<React.JSX.Element> {
  await connection();
  await requireDashboardPageOrRedirect('calendar');
  const { week, date, view, event } = await searchParams;
  const data = await getWorkspaceCalendarWeek(date ?? week, view);

  return (
    <WorkspaceCalendarWeek
      events={data.events}
      teamMembers={data.teamMembers}
      currentUserId={data.currentUserId}
      businessHours={data.businessHours}
      rangeStart={data.rangeStart}
      focusDate={data.focusDate}
      view={data.view}
      connections={data.connections}
      mailAutomation={data.mailAutomation}
      initialEventId={event}
    />
  );
}

export default function CalendarPage({
  searchParams
}: {
  searchParams: Promise<{
    week?: string;
    date?: string;
    view?: string;
    calendar?: string;
    event?: string;
  }>;
}): React.JSX.Element {
  return (
    <React.Suspense fallback={<CalendarFallback />}>
      <CalendarPageContent searchParams={searchParams} />
    </React.Suspense>
  );
}

import * as React from 'react';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';

import { WorkspaceCalendarWeek } from '@/components/dashboard/calendar/workspace-calendar-week';
import { Routes } from '@/constants/routes';
import { getWorkspaceCalendarWeek } from '@/data/calendar/get-workspace-calendar';
import { requireDashboardPageOrRedirect } from '@/lib/auth/require-workspace-access';
import { completeGoogleCalendarPageOAuth } from '@/lib/calendar/complete-calendar-oauth';

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
    code?: string;
    state?: string;
    error?: string;
    calendar?: string;
  }>;
}): Promise<React.JSX.Element> {
  await connection();
  await requireDashboardPageOrRedirect('calendar');
  const { week, date, view, code, state, error } = await searchParams;
  const oauthStatus = await completeGoogleCalendarPageOAuth({
    code,
    state,
    error
  });
  if (oauthStatus) {
    redirect(`${Routes.Calendar}?calendar=${oauthStatus}`);
  }
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
    code?: string;
    state?: string;
    error?: string;
    calendar?: string;
  }>;
}): React.JSX.Element {
  return (
    <React.Suspense fallback={<CalendarFallback />}>
      <CalendarPageContent searchParams={searchParams} />
    </React.Suspense>
  );
}

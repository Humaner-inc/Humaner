import * as React from 'react';
import { connection } from 'next/server';

import { WorkspaceTasksBoard } from '@/components/dashboard/tasks/workspace-tasks-board';
import { getHandoffDeskData } from '@/data/handoff/get-handoff-tickets';
import { requireDashboardPageOrRedirect } from '@/lib/auth/require-workspace-access';

function TasksFallback(): React.JSX.Element {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-4 px-6 py-5">
      <div className="h-8 w-40 animate-pulse bg-muted/40" />
      <div className="h-24 animate-pulse bg-muted/40" />
    </div>
  );
}

async function TasksPageContent(): Promise<React.JSX.Element> {
  await connection();
  await requireDashboardPageOrRedirect('tasks');
  const data = await getHandoffDeskData('tasks');

  return (
    <WorkspaceTasksBoard
      tickets={data.tickets}
      teamMembers={data.teamMembers}
      currentUserId={data.currentUserId}
      businessHours={data.businessHours}
    />
  );
}

export default function TasksPage(): React.JSX.Element {
  return (
    <React.Suspense fallback={<TasksFallback />}>
      <TasksPageContent />
    </React.Suspense>
  );
}

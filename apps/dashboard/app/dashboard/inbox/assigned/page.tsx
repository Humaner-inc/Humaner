import * as React from 'react';

import { AssignedWorkList } from '@/components/dashboard/inbox/assigned-work-list';
import { InboxUpgradeEmptyState } from '@/components/dashboard/inbox/inbox-empty-state';
import { getInboxOverview } from '@/data/inbox/get-inbox-overview';
import { getMailThreads } from '@/data/inbox/get-mail-threads';
import { getAssignedTasks } from '@/data/tasks/get-assigned-tasks';

export default async function InboxAssignedPage(): Promise<React.JSX.Element> {
  const overviewPromise = getInboxOverview();
  const mailPromise = getMailThreads({ assignedToCurrentUser: true });
  const tasksPromise = getAssignedTasks();

  const overview = await overviewPromise;

  if (!overview) {
    return (
      <div className="p-6 md:p-8">
        <InboxUpgradeEmptyState />
      </div>
    );
  }

  const [threads, tasks] = await Promise.all([mailPromise, tasksPromise]);

  return (
    <AssignedWorkList
      threads={overview.locked ? [] : threads}
      tasks={tasks}
    />
  );
}

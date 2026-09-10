import * as React from 'react';

import { InboxOptionalEmptyState } from '@/components/dashboard/inbox/inbox-empty-state';

export default function InboxDraftsPage(): React.JSX.Element {
  return (
    <div className="p-6 md:p-8">
      <InboxOptionalEmptyState
        title="No drafts"
        description="Compose from an alias. Unsent mail will land here."
        showConnect={false}
      />
    </div>
  );
}

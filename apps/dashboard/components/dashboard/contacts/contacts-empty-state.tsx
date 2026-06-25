import * as React from 'react';
import { UsersIcon } from 'lucide-react';

import { AddContactButton } from '@/components/dashboard/contacts/add-contact-button';
import { EmptyState } from '@/components/ui/empty-state';

export function ContactsEmptyState(): React.JSX.Element {
  return (
    <div className="p-6">
      <EmptyState
        icon={
          <div className="flex size-12 items-center justify-center rounded-md border">
            <UsersIcon className="size-6 shrink-0 text-muted-foreground" />
          </div>
        }
        title="No contact yet"
        description="Add contacts and they will show up here."
      >
        <AddContactButton />
      </EmptyState>
    </div>
  );
}

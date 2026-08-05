import * as React from 'react';
import { UsersIcon } from '@humaner/shared/icons';

import { AddContactButton } from '@/components/dashboard/contacts/add-contact-button';
import { EmptyState } from '@/components/ui/empty-state';

export function ContactsEmptyState(): React.JSX.Element {
  return (
    <div className="p-6">
      <EmptyState
        icon={<UsersIcon strokeWidth={1.25} />}
        title="No contact yet"
        description="Add contacts and they will show up here."
      >
        <AddContactButton />
      </EmptyState>
    </div>
  );
}

import * as React from 'react';

import { ContactTasks } from '@/components/dashboard/contacts/details/tasks/contact-tasks';
import { getContactTasks } from '@/data/contacts/get-contact-tasks';
import type { ContactDto } from '@/types/dtos/contact-dto';

export type ContactTasksTabProps = {
  contact: ContactDto;
};

export async function ContactTasksTab({
  contact
}: ContactTasksTabProps): Promise<React.JSX.Element> {
  const tasks = await getContactTasks({ contactId: contact.id });
  return (
    <ContactTasks
      contact={contact}
      tasks={tasks}
    />
  );
}

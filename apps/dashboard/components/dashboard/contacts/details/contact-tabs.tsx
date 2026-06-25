import * as React from 'react';
import { ActivityIcon, CheckSquare2Icon, FileIcon } from 'lucide-react';

import { ContactNotesTab } from '@/components/dashboard/contacts/details/notes/contact-notes-tab';
import { ContactTasksTab } from '@/components/dashboard/contacts/details/tasks/contact-tasks-tab';
import { ContactActivityTab } from '@/components/dashboard/contacts/details/timeline/contact-activity-tab';
import { Separator } from '@/components/ui/separator';
import {
  UnderlinedTabs,
  UnderlinedTabsContent,
  UnderlinedTabsList,
  UnderlinedTabsTrigger
} from '@/components/ui/tabs';
import type { ContactDto } from '@/types/dtos/contact-dto';

enum Tab {
  Activity = 'activity',
  Notes = 'notes',
  Tasks = 'tasks'
}

const tabList = [
  {
    icon: ActivityIcon,
    label: 'Activity',
    value: Tab.Activity
  },
  {
    icon: FileIcon,
    label: 'Notes',
    value: Tab.Notes
  },
  {
    icon: CheckSquare2Icon,
    label: 'Tasks',
    value: Tab.Tasks
  }
];

export type ContactTabsProps = {
  contact: ContactDto;
};

export async function ContactTabs({
  contact
}: ContactTabsProps): Promise<React.JSX.Element> {
  return (
    <UnderlinedTabs
      defaultValue={Tab.Activity}
      className="flex size-full flex-col"
    >
      <UnderlinedTabsList className="h-12 max-h-12 min-h-12 gap-x-2 overflow-x-auto border-none px-4">
        {tabList.map((item) => (
          <UnderlinedTabsTrigger
            key={item.value}
            value={item.value}
            className="mx-0 border-t-4 border-t-transparent"
          >
            <div className="flex flex-row items-center gap-2 rounded-md px-2 py-1 hover:bg-accent">
              <item.icon className="size-4 shrink-0" />
              {item.label}
            </div>
          </UnderlinedTabsTrigger>
        ))}
      </UnderlinedTabsList>
      <Separator />
      <UnderlinedTabsContent
        value={Tab.Activity}
        className="m-0 p-0 md:grow md:overflow-hidden"
      >
        <React.Suspense>
          <ContactActivityTab contact={contact} />
        </React.Suspense>
      </UnderlinedTabsContent>
      <UnderlinedTabsContent
        value={Tab.Notes}
        className="m-0 p-0 md:grow md:overflow-hidden"
      >
        <React.Suspense>
          <ContactNotesTab contact={contact} />
        </React.Suspense>
      </UnderlinedTabsContent>
      <UnderlinedTabsContent
        value={Tab.Tasks}
        className="m-0 p-0 md:grow md:overflow-hidden"
      >
        <React.Suspense>
          <ContactTasksTab contact={contact} />
        </React.Suspense>
      </UnderlinedTabsContent>
    </UnderlinedTabs>
  );
}

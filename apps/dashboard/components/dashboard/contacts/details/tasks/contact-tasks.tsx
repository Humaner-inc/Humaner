'use client';

import * as React from 'react';
import NiceModal from '@ebay/nice-modal-react';
import { ContactTaskStatus } from '@prisma/client';
import { CheckSquare2Icon } from 'lucide-react';

import { AddContactTaskModal } from '@/components/dashboard/contacts/details/tasks/add-contact-task-modal';
import { ContactTaskList } from '@/components/dashboard/contacts/details/tasks/contact-task-list';
import { Button } from '@/components/ui/button';
import { EmptyText } from '@/components/ui/empty-text';
import { ResponsiveScrollArea } from '@/components/ui/scroll-area';
import { MediaQueries } from '@/constants/media-queries';
import type { ContactDto } from '@/types/dtos/contact-dto';
import type { ContactTaskDto } from '@/types/dtos/contact-task-dto';

export type ContactTasksProps = {
  contact: ContactDto;
  tasks: ContactTaskDto[];
};

export function ContactTasks({
  contact,
  tasks
}: ContactTasksProps): React.JSX.Element {
  const openTasks = tasks.filter(
    (task) => task.status === ContactTaskStatus.OPEN
  );
  const completedTasks = tasks.filter(
    (task) => task.status === ContactTaskStatus.COMPLETED
  );
  const handleShowAddTaskModal = (): void => {
    NiceModal.show(AddContactTaskModal, { contactId: contact.id });
  };
  return (
    <ResponsiveScrollArea
      breakpoint={MediaQueries.MdUp}
      mediaQueryOptions={{ ssr: true }}
      className="h-full"
    >
      <div className="divide-y border-b">
        <div className="flex h-16 flex-row items-center justify-between gap-2 px-6">
          <h1 className="text-sm font-semibold">
            All tasks{' '}
            <span className="text-muted-foreground">({tasks.length})</span>
          </h1>
          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={handleShowAddTaskModal}
          >
            <CheckSquare2Icon className="mr-2 size-4 shrink-0" />
            Add task
          </Button>
        </div>
        <Heading>Open</Heading>
        {openTasks.length > 0 ? (
          <ContactTaskList tasks={openTasks} />
        ) : (
          <EmptyText className="p-6">
            There is no open task for this contact.
          </EmptyText>
        )}
        <Heading>Completed</Heading>
        {completedTasks.length > 0 ? (
          <ContactTaskList tasks={completedTasks} />
        ) : (
          <EmptyText className="p-6">
            There is no completed task for this contact.
          </EmptyText>
        )}
      </div>
    </ResponsiveScrollArea>
  );
}

function Heading(props: React.PropsWithChildren): React.JSX.Element {
  return (
    <h4 className="bg-neutral-50 px-6 py-3 text-sm font-medium text-muted-foreground dark:bg-neutral-900">
      {props.children}
    </h4>
  );
}

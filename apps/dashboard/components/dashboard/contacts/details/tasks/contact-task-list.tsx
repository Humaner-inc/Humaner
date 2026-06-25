'use client';

import * as React from 'react';
import NiceModal from '@ebay/nice-modal-react';
import { ContactTaskStatus } from '@prisma/client';
import { MoreHorizontalIcon } from 'lucide-react';
import { toast } from 'sonner';

import { updateContactTask } from '@/actions/contacts/update-contact-task';
import { DeleteContactTaskModal } from '@/components/dashboard/contacts/details/tasks/delete-contact-task-modal';
import { EditContactTaskModal } from '@/components/dashboard/contacts/details/tasks/edit-contact-task-modal';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/date-picker';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { ContactTaskDto } from '@/types/dtos/contact-task-dto';

export type ContactTaskListProps =
  React.HtmlHTMLAttributes<HTMLUListElement> & {
    tasks: ContactTaskDto[];
  };

export function ContactTaskList({
  tasks,
  className,
  ...other
}: ContactTaskListProps): React.JSX.Element {
  const handleStatusChange = async (
    taskId: string,
    status: ContactTaskStatus
  ) => {
    const task = tasks.find((task) => task.id === taskId);
    if (task) {
      const result = await updateContactTask({ ...task, status });
      if (!result?.serverError && !result?.validationErrors) {
        toast.success('Status updated');
      } else {
        toast.error("Couldn't update status");
      }
    }
  };
  const handleDueDateChange = async (taskId: string, dueDate?: Date) => {
    const task = tasks.find((task) => task.id === taskId);
    if (task) {
      const result = await updateContactTask({ ...task, dueDate });
      if (!result?.serverError && !result?.validationErrors) {
        toast.success('Due date updated');
      } else {
        toast.error("Couldn't update due date");
      }
    }
  };
  const handleShowEditTaskModal = (taskId: string) => {
    const task = tasks.find((task) => task.id === taskId);
    if (task) {
      NiceModal.show(EditContactTaskModal, { task });
    }
  };
  const handleShowDeleteTaskModal = (taskId: string) => {
    const task = tasks.find((task) => task.id === taskId);
    if (task) {
      NiceModal.show(DeleteContactTaskModal, { task });
    }
  };
  return (
    <ul
      role="list"
      className={cn('m-0 list-none divide-y p-0', className)}
      {...other}
    >
      {tasks.map((task) => (
        <ContactTaskListItem
          key={task.id}
          {...task}
          onStatusChange={(status) => handleStatusChange(task.id, status)}
          onDueDateChange={(dueDate) => handleDueDateChange(task.id, dueDate)}
          onEdit={() => handleShowEditTaskModal(task.id)}
          onDelete={() => handleShowDeleteTaskModal(task.id)}
        />
      ))}
    </ul>
  );
}

type ContactTaskListItemProps = ContactTaskDto & {
  onStatusChange: (status: ContactTaskStatus) => void;
  onDueDateChange: (dueDate?: Date) => void;
  onEdit: () => void;
  onDelete: () => void;
};

function ContactTaskListItem({
  id,
  status,
  title,
  dueDate,
  onStatusChange,
  onDueDateChange,
  onEdit,
  onDelete
}: ContactTaskListItemProps): React.JSX.Element {
  return (
    <li
      role="listitem"
      className="px-6 py-4"
    >
      <div className="flex flex-row items-center justify-between">
        <div className="flex min-w-0 flex-1 flex-row items-center gap-2">
          <Checkbox
            id={id}
            checked={status === ContactTaskStatus.COMPLETED}
            className="rounded-full"
            onCheckedChange={(value) =>
              onStatusChange(
                value ? ContactTaskStatus.COMPLETED : ContactTaskStatus.OPEN
              )
            }
          />
          <Label
            htmlFor={id}
            className={cn(
              'cursor-pointer truncate',
              status === ContactTaskStatus.COMPLETED && 'line-through'
            )}
          >
            {title}
          </Label>
        </div>
        <div className="flex shrink-0 flex-row items-center gap-1.5">
          <DatePicker
            date={dueDate}
            onDateChange={onDueDateChange}
            placeholder="Due date"
            variant="ghost"
            className="hidden sm:inline-flex"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="size-9"
                title="Open menu"
              >
                <MoreHorizontalIcon className="size-4 shrink-0" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="!text-destructive"
                onClick={onDelete}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </li>
  );
}

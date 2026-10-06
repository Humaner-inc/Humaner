'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { assignHandoffTicket } from '@/actions/handoff/assign-handoff-ticket';
import { AssigneeMenuItems } from '@/components/dashboard/assignee-options';
import { AssigneeFace } from '@/components/ui/assignees';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { dashboardRadiusClassName } from '@/lib/dashboard/surface-styles';
import { cn } from '@/lib/utils';

export type DeskAssigneeOption = {
  id: string;
  name: string;
  image: string | null;
  email?: string | null;
};

export type DeskAssigneePickerProps = {
  ticketId: string;
  teamMembers: DeskAssigneeOption[];
  currentUserId: string;
  value: string | null;
  /** Compact trigger for dense lists / notifications. */
  compact?: boolean;
  className?: string;
  onAssigned?: (assigneeId: string | null) => void;
};

export function DeskAssigneePicker({
  ticketId,
  teamMembers,
  currentUserId,
  value,
  className,
  onAssigned
}: DeskAssigneePickerProps): React.JSX.Element {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [assigneeId, setAssigneeId] = React.useState(value);

  React.useEffect(() => {
    setAssigneeId(value);
  }, [value, ticketId]);

  const selected =
    teamMembers.find((member) => member.id === assigneeId) ?? null;

  const handleChange = (next: string | null): void => {
    const previous = assigneeId;
    setAssigneeId(next);
    startTransition(async () => {
      const result = await assignHandoffTicket({
        id: ticketId,
        assigneeId: next
      });
      if (result?.serverError) {
        setAssigneeId(previous);
        toast.error(result.serverError);
        return;
      }
      onAssigned?.(next);
      router.refresh();
      toast.success(next ? 'Ticket assigned' : 'Ticket unassigned');
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={pending}
          className={cn(
            'h-7 max-h-none min-h-7 justify-start gap-1.5 px-1 font-normal',
            className
          )}
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <AssigneeFace
            person={selected}
            size={20}
          />
          <span className="max-w-20 truncate">
            {selected
              ? selected.id === currentUserId
                ? 'You'
                : selected.name.split(' ')[0]
              : 'Assign'}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        matchTrigger
        className={dashboardRadiusClassName}
        onClick={(event) => event.stopPropagation()}
      >
        <AssigneeMenuItems
          members={teamMembers}
          value={assigneeId}
          currentUserId={currentUserId}
          onSelect={handleChange}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

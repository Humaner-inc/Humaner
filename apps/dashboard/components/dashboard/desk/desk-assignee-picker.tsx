'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { assignHandoffTicket } from '@/actions/handoff/assign-handoff-ticket';
import {
  AssigneeFaces,
  AssigneeMenuItems
} from '@/components/dashboard/assignee-options';
import { DESK_TICKET_ACTION_CHIP_CLASSNAME } from '@/components/dashboard/desk/desk-ticket-preview-row';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
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
  compact = false,
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
          variant="outline"
          size="sm"
          disabled={pending}
          className={cn(
            compact
              ? DESK_TICKET_ACTION_CHIP_CLASSNAME
              : 'h-7 gap-1.5 rounded-lg px-2',
            'h-7 max-h-none min-h-7 gap-1.5 overflow-visible',
            className
          )}
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <AssigneeFaces people={selected ? [selected] : []} />
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
        className="w-56 rounded-lg"
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

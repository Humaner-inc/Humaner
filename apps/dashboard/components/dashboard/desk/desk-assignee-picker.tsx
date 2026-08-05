'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { CheckIcon, ChevronDownIcon, UserIcon } from '@humaner/shared/icons';
import { toast } from 'sonner';

import { assignHandoffTicket } from '@/actions/handoff/assign-handoff-ticket';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
          disabled={pending || teamMembers.length === 0}
          className={cn(
            'gap-1.5 rounded-none',
            compact ? 'h-5 px-1.5 text-[10px] font-medium leading-none' : 'h-7',
            className
          )}
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
        >
          {selected ? (
            <AssigneeAvatar
              assignee={selected}
              className={compact ? 'size-3.5' : 'size-4'}
            />
          ) : (
            <UserIcon className={compact ? 'size-3' : 'size-3.5'} />
          )}
          <span className="max-w-20 truncate">
            {selected
              ? selected.id === currentUserId
                ? 'You'
                : selected.name.split(' ')[0]
              : 'Assign'}
          </span>
          <ChevronDownIcon
            className={cn('opacity-50', compact ? 'size-3' : 'size-3.5')}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 rounded-none"
        onClick={(event) => event.stopPropagation()}
      >
        <DropdownMenuItem
          className="text-xs"
          onSelect={() => handleChange(null)}
        >
          Unassigned
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {teamMembers.map((member) => (
          <DropdownMenuItem
            key={member.id}
            className="flex items-center gap-2 text-xs"
            onSelect={() => handleChange(member.id)}
          >
            <AssigneeAvatar
              assignee={member}
              className="size-6"
            />
            <span className="min-w-0 flex-1 truncate">
              {member.name}
              {member.id === currentUserId ? ' (you)' : ''}
            </span>
            {assigneeId === member.id ? (
              <CheckIcon className="size-3.5 text-primary" />
            ) : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AssigneeAvatar({
  assignee,
  className
}: {
  assignee: { name: string; image: string | null };
  className?: string;
}): React.JSX.Element {
  const initials = assignee.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <Avatar className={cn('bg-muted', className)}>
      {assignee.image ? (
        <AvatarImage
          src={assignee.image}
          alt={assignee.name}
        />
      ) : null}
      <AvatarFallback className="text-[9px] font-medium">
        {initials || <UserIcon className="size-3" />}
      </AvatarFallback>
    </Avatar>
  );
}

'use client';

import * as React from 'react';
import { CheckIcon, ChevronDownIcon } from '@humaner/shared/icons';

import { CompanionIcon } from '@/components/dashboard/ask-humaner/companion-icon';
import {
  ASSIGNEE_PANEL_PROPS,
  AssigneeFace,
  Assignees,
  type AssigneePerson
} from '@/components/ui/assignees';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { COMPANION_ASSIGNEE } from '@/lib/inbox/mail-assignee-shared';
import { cn } from '@/lib/utils';

export type { AssigneePerson };

export { toAssigneePerson } from '@/components/ui/assignees';

export const COMPANION_ASSIGNEE_PERSON: AssigneePerson = {
  id: COMPANION_ASSIGNEE,
  name: 'Companion',
  fallback: (
    <CompanionIcon
      size={16}
      className="size-4"
    />
  )
};

export function AssigneeFaces({
  people
}: {
  people: AssigneePerson[];
}): React.JSX.Element {
  return (
    <Assignees
      people={people}
      corner={ASSIGNEE_PANEL_PROPS.corner}
      stack={ASSIGNEE_PANEL_PROPS.stack}
      overlap={ASSIGNEE_PANEL_PROPS.overlap}
    />
  );
}

function optionLabel(member: AssigneePerson, currentUserId?: string): string {
  if (currentUserId && member.id === currentUserId) {
    return `${member.name} (you)`;
  }
  return member.name;
}

export function AssigneeMenuItems({
  members,
  value,
  includeCompanion = false,
  currentUserId,
  onSelect
}: {
  members: AssigneePerson[];
  value: string | null;
  includeCompanion?: boolean;
  currentUserId?: string;
  onSelect: (assigneeId: string | null) => void;
}): React.JSX.Element {
  const unassigned = value == null || value === '';

  return (
    <>
      <DropdownMenuItem
        className="gap-2 text-xs"
        onSelect={() => onSelect(null)}
      >
        <AssigneeFaces people={[]} />
        <span className="min-w-0 flex-1 truncate">Unassigned</span>
        {unassigned ? <CheckIcon className="size-3.5 text-primary" /> : null}
      </DropdownMenuItem>
      {includeCompanion ? (
        <DropdownMenuItem
          className="gap-2 text-xs"
          onSelect={() => onSelect(COMPANION_ASSIGNEE)}
        >
          <AssigneeFaces people={[COMPANION_ASSIGNEE_PERSON]} />
          <span className="min-w-0 flex-1 truncate">Companion</span>
          {value === COMPANION_ASSIGNEE ? (
            <CheckIcon className="size-3.5 text-primary" />
          ) : null}
        </DropdownMenuItem>
      ) : null}
      {members.map((member) => (
        <DropdownMenuItem
          key={member.id}
          className="gap-2 text-xs"
          onSelect={() => onSelect(member.id)}
        >
          <AssigneeFaces people={[member]} />
          <span className="min-w-0 flex-1 truncate">
            {optionLabel(member, currentUserId)}
          </span>
          {value === member.id ? (
            <CheckIcon className="size-3.5 text-primary" />
          ) : null}
        </DropdownMenuItem>
      ))}
    </>
  );
}

export function AssigneePicker({
  members,
  value,
  includeCompanion = false,
  currentUserId,
  onChange,
  disabled,
  compact = false,
  align = 'end',
  triggerLabel,
  className
}: {
  members: AssigneePerson[];
  value: string | null;
  includeCompanion?: boolean;
  currentUserId?: string;
  onChange: (assigneeId: string | null) => void;
  disabled?: boolean;
  compact?: boolean;
  align?: 'start' | 'end';
  triggerLabel?: string;
  className?: string;
}): React.JSX.Element {
  const selected =
    value === COMPANION_ASSIGNEE
      ? COMPANION_ASSIGNEE_PERSON
      : (members.find((member) => member.id === value) ?? null);

  const label =
    triggerLabel ??
    (selected
      ? currentUserId && selected.id === currentUserId
        ? 'You'
        : selected.name.split(' ')[0]
      : 'Assign');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="background"
          size="sm"
          disabled={disabled}
          className={cn(
            'items-center justify-start font-normal normal-case tracking-normal leading-none',
            compact ? 'h-7 gap-1.5 px-1.5' : 'h-10 gap-2 px-2',
            className
          )}
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <AssigneeFace
            person={selected}
            size={compact ? 20 : 24}
          />
          <span className="min-w-0 max-w-24 truncate leading-none">
            {label}
          </span>
          <ChevronDownIcon className="ml-auto size-3.5 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        className="w-56 rounded-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <AssigneeMenuItems
          members={members}
          value={value}
          includeCompanion={includeCompanion}
          currentUserId={currentUserId}
          onSelect={onChange}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

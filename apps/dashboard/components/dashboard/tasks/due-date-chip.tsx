'use client';

import * as React from 'react';
import { CalendarIcon } from '@humaner/shared/icons';

import { QUICK_CREATE_CHIP_CLASS } from '@/components/dashboard/quick-create-dialog';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import {
  dueEndOfWeek,
  dueInOneWeek,
  dueTomorrow,
  formatDueLabel
} from '@/lib/tasks/due-date';
import { cn } from '@/lib/utils';

const PRESETS = [
  { id: 'tomorrow', label: 'Tomorrow', resolve: dueTomorrow },
  { id: 'week-end', label: 'End of this week', resolve: dueEndOfWeek },
  { id: 'week', label: 'In one week', resolve: dueInOneWeek }
] as const;

export function DueDateChip({
  value,
  onChange,
  className
}: {
  value: Date | null;
  onChange: (date: Date | null) => void;
  className?: string;
}): React.JSX.Element {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(QUICK_CREATE_CHIP_CLASS, className)}
        >
          <CalendarIcon className="size-3.5 shrink-0" />
          {value ? formatDueLabel(value) : 'Due date'}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-auto border-border bg-background p-1 shadow-lg"
      >
        {PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs hover:bg-accent"
            onClick={() => {
              onChange(preset.resolve());
              setOpen(false);
            }}
          >
            <span>{preset.label}</span>
            <span className="font-mono text-[10px] text-muted-foreground">
              {formatDueLabel(preset.resolve())}
            </span>
          </button>
        ))}
        <div className="mt-1 border-t border-border/60 p-1">
          <Calendar
            mode="single"
            selected={value ?? undefined}
            defaultMonth={value ?? undefined}
            onSelect={(date) => {
              onChange(date ?? null);
              if (date) setOpen(false);
            }}
          />
        </div>
        {value ? (
          <button
            type="button"
            className="mt-1 w-full rounded-md px-2 py-1.5 text-left text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
          >
            Clear due date
          </button>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}

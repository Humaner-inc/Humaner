'use client';

import * as React from 'react';
import { CalendarIcon } from '@humaner/shared/icons';
import { format } from 'date-fns';

import { QUICK_CREATE_CHIP_CLASS } from '@/components/dashboard/quick-create-dialog';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import {
  fromLocalDateTimeInput,
  toLocalDateTimeInput
} from '@/lib/calendar/calendar-view';
import { brandAngleSurfaceClassName } from '@/lib/dashboard/brand-angle-styles';
import { cn } from '@/lib/utils';

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function parseDraftDate(value: string): Date | null {
  const date = fromLocalDateTimeInput(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export const EVENT_PICKER_SURFACE = cn(
  brandAngleSurfaceClassName('rounded-[12px]'),
  'z-[60] w-auto border-border/60 bg-background p-2 text-popover-foreground shadow-lg'
);

export function EventDateTimeChip({
  value,
  onChange,
  label
}: {
  value: string;
  onChange: (next: string) => void;
  label: string;
}): React.JSX.Element {
  const date = parseDraftDate(value);
  const hours = date?.getHours() ?? 9;
  const minutes = date?.getMinutes() ?? 0;

  const write = (next: Date): void => {
    onChange(toLocalDateTimeInput(next));
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={QUICK_CREATE_CHIP_CLASS}
          aria-label={label}
        >
          <CalendarIcon className="size-3.5 shrink-0" />
          {date ? format(date, 'd MMM · HH:mm') : label}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className={EVENT_PICKER_SURFACE}
      >
        <Calendar
          mode="single"
          selected={date ?? undefined}
          defaultMonth={date ?? undefined}
          onSelect={(next) => {
            if (!next) return;
            next.setHours(hours, minutes, 0, 0);
            write(next);
          }}
        />
        <div className="mt-2 flex items-center justify-between gap-2 border-t border-border/60 px-2 pt-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            Time
          </span>
          <input
            type="time"
            value={`${pad(hours)}:${pad(minutes)}`}
            onChange={(event) => {
              const [nextHours, nextMinutes] = event.target.value
                .split(':')
                .map(Number);
              const next = date ? new Date(date) : new Date();
              next.setHours(nextHours || 0, nextMinutes || 0, 0, 0);
              write(next);
            }}
            className="h-7 rounded-lg border border-border/60 bg-transparent px-2 font-mono text-xs text-foreground outline-none dark:[color-scheme:dark]"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

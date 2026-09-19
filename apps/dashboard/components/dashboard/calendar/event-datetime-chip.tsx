'use client';

import * as React from 'react';
import { CalendarIcon } from '@humaner/shared/icons';
import { format } from 'date-fns';

import {
  WORKSPACE_CALENDAR_POPOVER_CLASS,
  WorkspaceCalendarGrid
} from '@/components/dashboard/calendar/workspace-calendar-grid';
import { QUICK_CREATE_CHIP_CLASS } from '@/components/dashboard/quick-create-dialog';
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

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);
const MINUTES = [0, 15, 30, 45];

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function parseDraftDate(value: string): Date | null {
  const date = fromLocalDateTimeInput(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function nearestMinute(value: number): number {
  const snapped = MINUTES.reduce((best, step) =>
    Math.abs(step - value) < Math.abs(best - value) ? step : best
  );
  return snapped;
}

export const EVENT_PICKER_SURFACE = cn(
  brandAngleSurfaceClassName('rounded-[12px]'),
  'z-[60] w-auto border-border/60 bg-background p-2 text-popover-foreground shadow-lg'
);

const TIME_SELECT_CLASS =
  'h-7 rounded-lg border border-border/60 bg-transparent px-1.5 font-mono text-xs text-foreground outline-none';

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
  const [open, setOpen] = React.useState(false);
  const [visibleMonth, setVisibleMonth] = React.useState(
    () => date ?? new Date()
  );
  const hours = date?.getHours() ?? 9;
  const minutes = nearestMinute(date?.getMinutes() ?? 0);

  React.useEffect(() => {
    if (date) setVisibleMonth(date);
  }, [value]);

  const write = (next: Date): void => {
    onChange(toLocalDateTimeInput(next));
  };

  const setClock = (nextHours: number, nextMinutes: number): void => {
    const next = date ? new Date(date) : new Date();
    next.setHours(nextHours, nextMinutes, 0, 0);
    write(next);
  };

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
    >
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
        alignOffset={0}
        side="bottom"
        sideOffset={6}
        className={WORKSPACE_CALENDAR_POPOVER_CLASS}
      >
        <WorkspaceCalendarGrid
          selected={date ?? undefined}
          month={visibleMonth}
          onMonthChange={setVisibleMonth}
          onSelect={(next) => {
            next.setHours(hours, minutes, 0, 0);
            write(next);
          }}
        />
        <div className="flex items-center justify-between gap-2 border-t border-border/60 px-3 py-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            Time
          </span>
          <div className="flex items-center gap-1">
            <select
              aria-label={`${label} hour`}
              value={hours}
              onChange={(event) =>
                setClock(Number(event.target.value), minutes)
              }
              className={TIME_SELECT_CLASS}
            >
              {HOURS.map((hour) => (
                <option
                  key={hour}
                  value={hour}
                >
                  {pad(hour)}
                </option>
              ))}
            </select>
            <span className="font-mono text-xs text-muted-foreground">:</span>
            <select
              aria-label={`${label} minute`}
              value={minutes}
              onChange={(event) => setClock(hours, Number(event.target.value))}
              className={TIME_SELECT_CLASS}
            >
              {MINUTES.map((minute) => (
                <option
                  key={minute}
                  value={minute}
                >
                  {pad(minute)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

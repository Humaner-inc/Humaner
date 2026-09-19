'use client';

import * as React from 'react';

import { Calendar } from '@/components/ui/calendar';
import { HUMANER_NAV_COLORS } from '@/lib/humaner-nav-colors';

/** Same calendar chrome as the /calendar toolbar picker. */
export const WORKSPACE_CALENDAR_CLASS_NAMES = {
  caption_label: 'font-mono text-xs font-medium capitalize',
  cell: 'relative p-0 text-center text-sm focus-within:relative focus-within:z-20',
  day_selected:
    'bg-transparent text-[#f85919] hover:bg-transparent hover:text-[#f85919] focus:bg-transparent focus:text-[#f85919]',
  day_today: 'bg-transparent font-medium text-[#f85919]'
} as const;

export const WORKSPACE_CALENDAR_MODIFIERS_STYLES = {
  selected: {
    color: HUMANER_NAV_COLORS.warning,
    backgroundColor: 'transparent'
  },
  today: {
    color: HUMANER_NAV_COLORS.warning,
    backgroundColor: 'transparent'
  }
} as const;

export const WORKSPACE_CALENDAR_POPOVER_CLASS =
  'z-[60] w-auto rounded-lg border-border/60 bg-popover p-0 text-popover-foreground shadow-md';

export function WorkspaceCalendarGrid({
  selected,
  month,
  onMonthChange,
  onSelect
}: {
  selected?: Date;
  month?: Date;
  onMonthChange?: (month: Date) => void;
  onSelect: (date: Date) => void;
}): React.JSX.Element {
  return (
    <Calendar
      mode="single"
      selected={selected}
      month={month}
      onMonthChange={onMonthChange}
      onSelect={(date) => {
        if (!date) return;
        onSelect(date);
      }}
      weekStartsOn={1}
      fixedWeeks
      showOutsideDays
      className="p-3"
      classNames={WORKSPACE_CALENDAR_CLASS_NAMES}
      modifiersStyles={WORKSPACE_CALENDAR_MODIFIERS_STYLES}
    />
  );
}

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { CaretDown } from '@phosphor-icons/react/dist/ssr/CaretDown';
import { Funnel } from '@phosphor-icons/react/dist/ssr/Funnel';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import {
  CALENDAR_VIEWS,
  calendarPath,
  type CalendarView
} from '@/lib/calendar/calendar-view';
import { HUMANER_NAV_COLORS } from '@/lib/humaner-nav-colors';
import { cn } from '@/lib/utils';

const TOOLBAR_BUTTON =
  'h-9 px-3 font-mono text-xs font-medium normal-case tracking-normal';

const VIEW_LABELS: Record<CalendarView, string> = {
  day: 'Day',
  week: 'Week',
  month: 'Month'
};

export function CalendarToolbar({
  focusDate,
  view,
  children
}: {
  focusDate: Date;
  view: CalendarView;
  children: React.ReactNode;
}): React.JSX.Element {
  const router = useRouter();
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [visibleMonth, setVisibleMonth] = React.useState(focusDate);
  const dateLabel = focusDate.toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const goTo = (nextDate: Date, nextView: CalendarView): void => {
    router.push(calendarPath(nextDate, nextView));
  };

  React.useEffect(() => {
    setVisibleMonth(focusDate);
  }, [focusDate]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Popover
        open={pickerOpen}
        onOpenChange={setPickerOpen}
      >
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(TOOLBAR_BUTTON, 'min-w-0 max-w-full')}
          >
            <span className="truncate">{dateLabel}</span>
            <CaretDown
              className="ml-1.5 size-3 shrink-0"
              weight="bold"
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          className="w-auto rounded-lg p-0"
        >
          <Calendar
            mode="single"
            selected={focusDate}
            month={visibleMonth}
            onMonthChange={setVisibleMonth}
            onSelect={(date) => {
              if (!date) return;
              goTo(date, view);
              setPickerOpen(false);
            }}
            weekStartsOn={1}
            fixedWeeks
            showOutsideDays
            className="p-3"
            classNames={{
              caption_label: 'font-mono text-xs font-medium capitalize',
              cell: 'relative p-0 text-center text-sm focus-within:relative focus-within:z-20',
              day_selected:
                'bg-transparent text-[#f85919] hover:bg-transparent hover:text-[#f85919] focus:bg-transparent focus:text-[#f85919]',
              day_today: 'bg-transparent font-medium text-[#f85919]'
            }}
            modifiersStyles={{
              selected: {
                color: HUMANER_NAV_COLORS.warning,
                backgroundColor: 'transparent'
              },
              today: {
                color: HUMANER_NAV_COLORS.warning,
                backgroundColor: 'transparent'
              }
            }}
          />
        </PopoverContent>
      </Popover>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={TOOLBAR_BUTTON}
          >
            <Funnel
              className="mr-1.5 size-3.5 shrink-0"
              weight="regular"
            />
            {VIEW_LABELS[view]}
            <CaretDown
              className="ml-1.5 size-3 shrink-0"
              weight="bold"
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="min-w-36 rounded-lg"
        >
          {CALENDAR_VIEWS.map((item) => (
            <DropdownMenuItem
              key={item}
              onSelect={() => goTo(focusDate, item)}
            >
              {VIEW_LABELS[item]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {children}
    </div>
  );
}

export { TOOLBAR_BUTTON };

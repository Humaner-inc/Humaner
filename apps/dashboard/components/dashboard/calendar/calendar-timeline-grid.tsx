'use client';

import * as React from 'react';

import { EventHoverCard } from '@/components/dashboard/calendar/event-hover-card';
import type {
  CalendarEventItem,
  CalendarTeamMember
} from '@/data/calendar/get-workspace-calendar';
import {
  DEFAULT_EVENT_COLOR,
  eventInkColor,
  snapMinutes
} from '@/lib/calendar/calendar-view';
import { cn } from '@/lib/utils';
import type { WorkHoursDto } from '@/types/dtos/work-hours-dto';

export const TIMELINE_SLOT_PX = 52;
export const EVENT_DRAG_MIME = 'application/x-humaner-calendar-event';

export type TimelinePeriod = 'am' | 'pm';

const DAY_ENUMS = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY'
] as const;

export type CreateRange = {
  day: Date;
  start: Date;
  end: Date;
};

export type MoveDragState = {
  id: string;
  grabOffsetMin: number;
};

type CreateDragState = {
  dayKey: string;
  day: Date;
  originMin: number;
  currentMin: number;
};

export function periodBounds(period: TimelinePeriod): {
  hourStart: number;
  hourEnd: number;
  hours: number;
} {
  if (period === 'am') {
    return { hourStart: 0, hourEnd: 12, hours: 12 };
  }
  return { hourStart: 12, hourEnd: 24, hours: 12 };
}

function minutesSincePeriodStart(date: Date, hourStart: number): number {
  return date.getHours() * 60 + date.getMinutes() - hourStart * 60;
}

function eventLayout(
  event: CalendarEventItem,
  hourStart: number,
  hours: number,
  slotPx: number
): { top: number; height: number; hidden: boolean } {
  const start = new Date(event.startsAt);
  const end = new Date(event.endsAt);
  const startMin = minutesSincePeriodStart(start, hourStart);
  const endMin = minutesSincePeriodStart(end, hourStart);
  const visibleStart = Math.max(0, startMin);
  const visibleEnd = Math.min(hours * 60, endMin);
  if (visibleEnd <= 0 || visibleStart >= hours * 60) {
    return { top: 0, height: 0, hidden: true };
  }
  return {
    top: (visibleStart / 60) * slotPx,
    height: Math.max(22, ((visibleEnd - visibleStart) / 60) * slotPx),
    hidden: false
  };
}

/** Only shade when the team has personalized slots for that day. */
function workingRange(
  hours: WorkHoursDto[],
  dayEnum: (typeof DAY_ENUMS)[number]
): { startMin: number; endMin: number } | null {
  if (hours.length === 0) return null;
  const row = hours.find((item) => item.dayOfWeek === dayEnum);
  const slots = row?.timeSlots ?? [];
  if (slots.length === 0) return null;
  let startMin = 24 * 60;
  let endMin = 0;
  for (const slot of slots) {
    const start = new Date(slot.start);
    const end = new Date(slot.end);
    startMin = Math.min(
      startMin,
      start.getUTCHours() * 60 + start.getUTCMinutes()
    );
    endMin = Math.max(endMin, end.getUTCHours() * 60 + end.getUTCMinutes());
  }
  if (endMin <= startMin) return null;
  return { startMin, endMin };
}

function dayEnumForDate(date: Date): (typeof DAY_ENUMS)[number] {
  const index = date.getDay() === 0 ? 6 : date.getDay() - 1;
  return DAY_ENUMS[index];
}

export function formatTimelineHour(hour: number): string {
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display} ${suffix}`;
}

function clampPeriodMinutes(
  minutes: number,
  hourStart: number,
  hourEnd: number
): number {
  return Math.min((hourEnd - 1) * 60, Math.max(hourStart * 60, minutes));
}

function minutesFromPointer(
  clientY: number,
  columnTop: number,
  slotPx: number,
  hourStart: number,
  hourEnd: number
): number {
  const offsetPx = clientY - columnTop;
  return clampPeriodMinutes(
    snapMinutes(hourStart * 60 + (offsetPx / slotPx) * 60),
    hourStart,
    hourEnd
  );
}

function rangeFromDrag(drag: CreateDragState): { start: Date; end: Date } {
  const low = Math.min(drag.originMin, drag.currentMin);
  const high = Math.max(drag.originMin, drag.currentMin);
  const endMin = high === low ? low + 60 : high;
  const start = new Date(drag.day);
  start.setHours(Math.floor(low / 60), low % 60, 0, 0);
  const end = new Date(drag.day);
  end.setHours(Math.floor(endMin / 60), endMin % 60, 0, 0);
  if (end <= start) {
    end.setTime(start.getTime() + 60 * 60 * 1000);
  }
  return { start, end };
}

function formatGhostTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function CalendarTimelineGrid({
  days,
  events,
  teamMembers,
  businessHours,
  selectedEventId,
  compact = false,
  onOpenEvent,
  onCreateRange,
  onBeginMove,
  onTimedDrop,
  moveDragRef
}: {
  days: Date[];
  events: CalendarEventItem[];
  teamMembers: CalendarTeamMember[];
  businessHours: WorkHoursDto[];
  selectedEventId?: string | null;
  compact?: boolean;
  onOpenEvent: (event: CalendarEventItem) => void;
  onCreateRange: (range: CreateRange) => void;
  onBeginMove: (
    event: CalendarEventItem,
    clientY: number,
    blockTop: number
  ) => void;
  /** Absolute minutes from midnight for the drop start. */
  onTimedDrop: (day: Date, startMinutesFromMidnight: number) => void;
  moveDragRef: React.MutableRefObject<MoveDragState | null>;
}): React.JSX.Element {
  const now = new Date();
  const slotPx = compact ? 40 : TIMELINE_SLOT_PX;
  const [period, setPeriod] = React.useState<TimelinePeriod>(() =>
    now.getHours() >= 12 ? 'pm' : 'am'
  );
  const { hourStart, hourEnd, hours } = periodBounds(period);
  const suppressClickRef = React.useRef(false);
  const createDragRef = React.useRef<CreateDragState | null>(null);
  const [createDrag, setCreateDrag] = React.useState<CreateDragState | null>(
    null
  );
  const [hover, setHover] = React.useState<{
    event: CalendarEventItem;
    x: number;
    y: number;
  } | null>(null);
  const hoverTimerRef = React.useRef<number | null>(null);

  const clearHoverTimer = (): void => {
    if (hoverTimerRef.current !== null) {
      window.clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  };

  React.useEffect(() => () => clearHoverTimer(), []);

  const finishCreateDrag = React.useCallback((): void => {
    const drag = createDragRef.current;
    createDragRef.current = null;
    setCreateDrag(null);
    if (!drag) return;
    suppressClickRef.current = true;
    const { start, end } = rangeFromDrag(drag);
    onCreateRange({ day: drag.day, start, end });
    window.setTimeout(() => {
      suppressClickRef.current = false;
    }, 0);
  }, [onCreateRange]);

  React.useEffect(() => {
    if (!createDrag) return;
    const onMove = (event: PointerEvent): void => {
      const current = createDragRef.current;
      if (!current) return;
      const column = document.querySelector<HTMLElement>(
        `[data-timeline-day="${current.dayKey}"]`
      );
      if (!column) return;
      const minutes = minutesFromPointer(
        event.clientY,
        column.getBoundingClientRect().top,
        slotPx,
        hourStart,
        hourEnd
      );
      createDragRef.current = { ...current, currentMin: minutes };
      setCreateDrag(createDragRef.current);
    };
    const onUp = (): void => {
      finishCreateDrag();
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [createDrag, finishCreateDrag, slotPx, hourStart, hourEnd]);

  const ghost =
    createDrag !== null
      ? (() => {
          const { start, end } = rangeFromDrag(createDrag);
          const startMin = minutesSincePeriodStart(start, hourStart);
          const endMin = minutesSincePeriodStart(end, hourStart);
          return {
            dayKey: createDrag.dayKey,
            top: (Math.max(0, startMin) / 60) * slotPx,
            height: Math.max(
              22,
              ((Math.min(hours * 60, endMin) - Math.max(0, startMin)) / 60) *
                slotPx
            ),
            label: `${formatGhostTime(start)} – ${formatGhostTime(end)}`
          };
        })()
      : null;

  return (
    <div
      className={cn('grid min-w-[320px]', days.length > 1 && 'min-w-[720px]')}
      style={{
        gridTemplateColumns: `3.5rem repeat(${days.length}, minmax(0, 1fr))`
      }}
    >
      <div className="sticky top-0 z-20 flex items-center justify-center border-b border-border/60 bg-background px-1 py-1.5">
        <button
          type="button"
          className={cn(
            'inline-flex h-8 min-w-[2.85rem] shrink-0 items-center justify-center rounded-[16px] px-2.5 font-mono text-[11px] font-medium uppercase leading-none tracking-[0.12em]',
            'transition-[color,background-color,border-color,box-shadow,transform] duration-200',
            'border border-[#0A0D0D] bg-[#0A0D0D] text-[#fcf4ec]',
            'shadow-[0_2px_0_0_#050707,inset_0_1px_0_0_rgb(255_255_255_/_0.14)]',
            'hover:bg-[#161919] hover:text-[#fcf4ec]',
            'active:translate-y-[2px] active:shadow-[0_0_0_0_#050707,inset_0_1px_0_0_rgb(255_255_255_/_0.08)]',
            'dark:border-[#e0e1df] dark:bg-[#e0e1df] dark:text-[#0A0D0D]',
            'dark:shadow-[0_2px_0_0_rgb(0_0_0_/_0.65),inset_0_1px_0_0_rgb(255_255_255_/_0.35)]',
            'dark:hover:border-white dark:hover:bg-white dark:hover:text-[#0A0D0D]',
            'dark:active:shadow-[0_0_0_0_rgb(0_0_0_/_0.65),inset_0_1px_0_0_rgb(255_255_255_/_0.2)]'
          )}
          aria-label={
            period === 'am' ? 'Show afternoon hours' : 'Show morning hours'
          }
          onClick={() =>
            setPeriod((current) => (current === 'am' ? 'pm' : 'am'))
          }
        >
          <span className="inline-block translate-x-[0.06em]">
            {period === 'am' ? 'AM' : 'PM'}
          </span>
        </button>
      </div>
      {days.map((day) => {
        const isToday = day.toDateString() === now.toDateString();
        return (
          <div
            key={day.toISOString()}
            className="sticky top-0 z-20 border-b border-l border-border/60 bg-background px-2 py-2 text-center"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              {day.toLocaleDateString([], { weekday: 'short' })}
            </p>
            <p
              className={cn(
                'mt-0.5 font-display leading-none',
                compact ? 'text-base' : 'text-lg',
                isToday && 'text-[#f85919]'
              )}
            >
              {day.getDate()}
            </p>
          </div>
        );
      })}

      <div className="relative">
        {Array.from({ length: hours }, (_, index) => (
          <div
            key={index}
            className="flex items-start justify-end border-b border-border/40 pr-2 pt-0.5 font-mono text-[10px] leading-none text-muted-foreground"
            style={{ height: slotPx }}
          >
            {formatTimelineHour(hourStart + index)}
          </div>
        ))}
      </div>

      {days.map((day) => {
        const dayKey = day.toDateString();
        const work = workingRange(businessHours, dayEnumForDate(day));
        const columnEvents = events.filter(
          (event) =>
            new Date(event.startsAt).toDateString() === day.toDateString()
        );
        return (
          <div
            key={`${day.toISOString()}-col`}
            data-timeline-day={dayKey}
            className="relative touch-none border-l border-border/60"
            style={{ height: hours * slotPx }}
            onPointerDown={(event) => {
              if (event.button !== 0) return;
              if ((event.target as HTMLElement).closest('[data-event-block]')) {
                return;
              }
              event.preventDefault();
              clearHoverTimer();
              setHover(null);
              const minutes = minutesFromPointer(
                event.clientY,
                event.currentTarget.getBoundingClientRect().top,
                slotPx,
                hourStart,
                hourEnd
              );
              const next: CreateDragState = {
                dayKey,
                day,
                originMin: minutes,
                currentMin: minutes
              };
              createDragRef.current = next;
              setCreateDrag(next);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = 'move';
            }}
            onDrop={(event) => {
              event.preventDefault();
              event.stopPropagation();
              const drag = moveDragRef.current;
              if (!drag) return;
              suppressClickRef.current = true;
              const offsetPx =
                event.clientY - event.currentTarget.getBoundingClientRect().top;
              const minutes = clampPeriodMinutes(
                snapMinutes(
                  hourStart * 60 + (offsetPx / slotPx) * 60 - drag.grabOffsetMin
                ),
                hourStart,
                hourEnd
              );
              onTimedDrop(day, minutes);
              window.setTimeout(() => {
                suppressClickRef.current = false;
              }, 0);
            }}
          >
            {work
              ? (() => {
                  const topMin = Math.max(work.startMin, hourStart * 60);
                  const bottomMin = Math.min(work.endMin, hourEnd * 60);
                  if (bottomMin <= topMin) return null;
                  return (
                    <div
                      className="pointer-events-none absolute inset-x-0 bg-muted/70"
                      style={{
                        top: ((topMin - hourStart * 60) / 60) * slotPx,
                        height: ((bottomMin - topMin) / 60) * slotPx
                      }}
                    />
                  );
                })()
              : null}
            {Array.from({ length: hours }, (_, index) => (
              <div
                key={index}
                className="border-b border-border/30"
                style={{ height: slotPx }}
              />
            ))}
            {ghost && ghost.dayKey === dayKey ? (
              <div
                className="pointer-events-none absolute inset-x-1 z-20 overflow-hidden rounded-lg bg-[#001afc] px-1.5 py-1 text-left text-white shadow-md"
                style={{ top: ghost.top, height: ghost.height }}
              >
                <p className="truncate font-mono text-[11px] font-medium">
                  (No title)
                </p>
                <p className="truncate font-mono text-[10px] opacity-90">
                  {ghost.label}
                </p>
              </div>
            ) : null}
            {columnEvents.map((event) => {
              const layout = eventLayout(event, hourStart, hours, slotPx);
              if (layout.hidden) return null;
              const color = event.color || DEFAULT_EVENT_COLOR;
              const selected = selectedEventId === event.id;
              return (
                <button
                  key={event.id}
                  type="button"
                  data-event-block
                  draggable
                  className={cn(
                    'absolute inset-x-1 z-10 cursor-grab overflow-hidden rounded-lg px-1.5 py-1 text-left transition-shadow active:cursor-grabbing',
                    selected && 'ring-2 ring-foreground/30 ring-offset-1'
                  )}
                  style={{
                    top: layout.top,
                    height: layout.height,
                    backgroundColor: color,
                    color: eventInkColor(color)
                  }}
                  onPointerDown={(pointer) => pointer.stopPropagation()}
                  onDragStart={(dragEvent) => {
                    dragEvent.stopPropagation();
                    clearHoverTimer();
                    setHover(null);
                    dragEvent.dataTransfer.setData(EVENT_DRAG_MIME, event.id);
                    dragEvent.dataTransfer.setData('text/plain', event.id);
                    dragEvent.dataTransfer.effectAllowed = 'move';
                    const blockTop =
                      dragEvent.currentTarget.getBoundingClientRect().top;
                    moveDragRef.current = {
                      id: event.id,
                      grabOffsetMin:
                        ((dragEvent.clientY - blockTop) / slotPx) * 60
                    };
                    onBeginMove(event, dragEvent.clientY, blockTop);
                  }}
                  onDragEnd={() => {
                    moveDragRef.current = null;
                  }}
                  onMouseEnter={(mouse) => {
                    clearHoverTimer();
                    const rect = mouse.currentTarget.getBoundingClientRect();
                    hoverTimerRef.current = window.setTimeout(() => {
                      setHover({
                        event,
                        x: rect.right + 8,
                        y: rect.top
                      });
                    }, 280);
                  }}
                  onMouseLeave={() => {
                    clearHoverTimer();
                    setHover(null);
                  }}
                  onClick={(click) => {
                    click.stopPropagation();
                    if (suppressClickRef.current) {
                      suppressClickRef.current = false;
                      return;
                    }
                    clearHoverTimer();
                    setHover(null);
                    onOpenEvent(event);
                  }}
                >
                  <p className="truncate font-mono text-[11px] font-medium">
                    {event.title}
                  </p>
                  {!compact || layout.height > 36 ? (
                    <p className="truncate font-mono text-[10px] opacity-80">
                      {new Date(event.startsAt).toLocaleTimeString([], {
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </p>
                  ) : null}
                </button>
              );
            })}
          </div>
        );
      })}

      {hover ? (
        <EventHoverCard
          event={hover.event}
          teamMembers={teamMembers}
          className="fixed"
          style={{
            left: Math.min(hover.x, window.innerWidth - 300),
            top: Math.min(hover.y, window.innerHeight - 200)
          }}
        />
      ) : null}
    </div>
  );
}

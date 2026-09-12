'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';

import { createCalendarEvent } from '@/actions/calendar/create-calendar-event';
import { deleteCalendarEvent } from '@/actions/calendar/delete-calendar-event';
import { updateCalendarEvent } from '@/actions/calendar/update-calendar-event';
import { CalendarConnectSettings } from '@/components/dashboard/calendar/calendar-connect-settings';
import {
  CalendarToolbar,
  TOOLBAR_BUTTON
} from '@/components/dashboard/calendar/calendar-toolbar';
import { WorkspacePageShell } from '@/components/dashboard/workspace-page-shell';
import { Button } from '@/components/ui/button';
import { ColorPicker } from '@/components/ui/color-picker';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type {
  CalendarConnectionItem,
  CalendarEventItem,
  CalendarTeamMember
} from '@/data/calendar/get-workspace-calendar';
import {
  CALENDAR_EVENT_COLORS,
  calendarRange,
  DEFAULT_EVENT_COLOR,
  defaultEventWindow,
  eventInkColor,
  fromLocalDateTimeInput,
  moveEventKeepingDuration,
  moveEventToDayKeepClock,
  parseCalendarDate,
  snapMinutes,
  startOfWeekMonday,
  toLocalDateTimeInput,
  type CalendarView
} from '@/lib/calendar/calendar-view';
import { cn } from '@/lib/utils';
import type { WorkHoursDto } from '@/types/dtos/work-hours-dto';

const HOUR_START = 7;
const HOUR_END = 21;
const HOURS = HOUR_END - HOUR_START;
const SLOT_PX = 52;
const EVENT_DRAG_MIME = 'application/x-humaner-calendar-event';
const DAY_ENUMS = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY'
] as const;

type Draft = {
  id?: string;
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  attendeeIds: string[];
  color: string;
};

type EventPatch = Partial<
  Pick<CalendarEventItem, 'startsAt' | 'endsAt' | 'color'>
>;

function minutesSinceStart(date: Date): number {
  return date.getHours() * 60 + date.getMinutes() - HOUR_START * 60;
}

function eventLayout(event: CalendarEventItem): {
  top: number;
  height: number;
  hidden: boolean;
} {
  const start = new Date(event.startsAt);
  const end = new Date(event.endsAt);
  const startMin = minutesSinceStart(start);
  const endMin = minutesSinceStart(end);
  const visibleStart = Math.max(0, startMin);
  const visibleEnd = Math.min(HOURS * 60, endMin);
  if (visibleEnd <= 0 || visibleStart >= HOURS * 60) {
    return { top: 0, height: 0, hidden: true };
  }
  return {
    top: (visibleStart / 60) * SLOT_PX,
    height: Math.max(22, ((visibleEnd - visibleStart) / 60) * SLOT_PX),
    hidden: false
  };
}

function workingRange(
  hours: WorkHoursDto[],
  dayEnum: (typeof DAY_ENUMS)[number]
): { startMin: number; endMin: number } | null {
  const row = hours.find((item) => item.dayOfWeek === dayEnum);
  const slots = row?.timeSlots ?? [];
  if (slots.length === 0) {
    if (dayEnum === 'SATURDAY' || dayEnum === 'SUNDAY') return null;
    return { startMin: 9 * 60, endMin: 17 * 60 };
  }
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
  return { startMin, endMin };
}

function dayEnumForDate(date: Date): (typeof DAY_ENUMS)[number] {
  const index = date.getDay() === 0 ? 6 : date.getDay() - 1;
  return DAY_ENUMS[index];
}

function formatHour(hour: number): string {
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display} ${suffix}`;
}

function draftFromWindow(
  window: { start: Date; end: Date },
  currentUserId: string,
  color = DEFAULT_EVENT_COLOR
): Draft {
  return {
    title: '',
    description: '',
    startsAt: toLocalDateTimeInput(window.start),
    endsAt: toLocalDateTimeInput(window.end),
    attendeeIds: [currentUserId],
    color
  };
}

export function WorkspaceCalendarWeek({
  events,
  teamMembers,
  currentUserId,
  businessHours,
  rangeStart: _rangeStart,
  focusDate,
  view,
  connections,
  mailAutomation
}: {
  events: CalendarEventItem[];
  teamMembers: CalendarTeamMember[];
  currentUserId: string;
  businessHours: WorkHoursDto[];
  rangeStart: string;
  focusDate: string;
  view: CalendarView;
  connections: CalendarConnectionItem[];
  mailAutomation: boolean;
}): React.JSX.Element {
  const router = useRouter();
  const focus = React.useMemo(() => parseCalendarDate(focusDate), [focusDate]);
  const days = React.useMemo(() => {
    if (view === 'day') {
      const date = new Date(focus);
      date.setHours(0, 0, 0, 0);
      return [date];
    }
    if (view === 'month') {
      const { start, end } = calendarRange(focus, 'month');
      const list: Date[] = [];
      const cursor = new Date(start);
      while (cursor < end) {
        list.push(new Date(cursor));
        cursor.setDate(cursor.getDate() + 1);
      }
      return list;
    }
    const weekStart = startOfWeekMonday(focus);
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + index);
      return date;
    });
  }, [focus, view]);
  const [draft, setDraft] = React.useState<Draft | null>(null);
  const [patches, setPatches] = React.useState<Record<string, EventPatch>>({});
  const dragRef = React.useRef<{
    id: string;
    grabOffsetMin: number;
  } | null>(null);
  const suppressClickRef = React.useRef(false);
  const now = new Date();

  const displayEvents = React.useMemo(
    () =>
      events.map((event) => {
        const patch = patches[event.id];
        return patch ? { ...event, ...patch } : event;
      }),
    [events, patches]
  );

  const { execute: createEvent, isExecuting: creating } = useAction(
    createCalendarEvent,
    {
      onSuccess: () => {
        toast.success('Event created');
        setDraft(null);
        router.refresh();
      },
      onError: ({ error }) => {
        toast.error(error.serverError || 'Could not create event');
      }
    }
  );
  const { execute: saveEvent, isExecuting: saving } = useAction(
    updateCalendarEvent,
    {
      onSuccess: () => {
        toast.success('Event updated');
        setDraft(null);
        router.refresh();
      },
      onError: ({ error }) => {
        toast.error(error.serverError || 'Could not update event');
      }
    }
  );
  const { execute: moveEvent, isExecuting: moving } = useAction(
    updateCalendarEvent,
    {
      onSuccess: () => {
        router.refresh();
      },
      onError: ({ error, input }) => {
        setPatches((current) => {
          const next = { ...current };
          delete next[input.id];
          return next;
        });
        toast.error(error.serverError || 'Could not move event');
      }
    }
  );
  const { execute: removeEvent, isExecuting: removing } = useAction(
    deleteCalendarEvent,
    {
      onSuccess: () => {
        toast.success('Event deleted');
        setDraft(null);
        router.refresh();
      },
      onError: ({ error }) => {
        toast.error(error.serverError || 'Could not delete event');
      }
    }
  );

  const pending = creating || saving || removing || moving;

  const openCreateAt = (
    day: Date,
    clientY: number,
    columnTop: number
  ): void => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    const offsetPx = clientY - columnTop;
    const minutes = snapMinutes(HOUR_START * 60 + (offsetPx / SLOT_PX) * 60);
    const clamped = Math.min(
      (HOUR_END - 1) * 60,
      Math.max(HOUR_START * 60, minutes)
    );
    const start = new Date(day);
    start.setHours(Math.floor(clamped / 60), clamped % 60, 0, 0);
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + 60);
    setDraft(draftFromWindow({ start, end }, currentUserId));
  };

  const openCreateNow = (day?: Date): void => {
    setDraft(
      draftFromWindow(defaultEventWindow(day ?? new Date()), currentUserId)
    );
  };

  const openEvent = (event: CalendarEventItem): void => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    setDraft({
      id: event.id,
      title: event.title,
      description: event.description ?? '',
      startsAt: toLocalDateTimeInput(new Date(event.startsAt)),
      endsAt: toLocalDateTimeInput(new Date(event.endsAt)),
      attendeeIds: event.attendeeIds.length
        ? event.attendeeIds
        : [event.createdById],
      color: event.color || DEFAULT_EVENT_COLOR
    });
  };

  const applyMove = (
    event: CalendarEventItem,
    next: { startsAt: Date; endsAt: Date }
  ): void => {
    const startsAt = next.startsAt.toISOString();
    const endsAt = next.endsAt.toISOString();
    if (startsAt === event.startsAt && endsAt === event.endsAt) return;
    setPatches((current) => ({
      ...current,
      [event.id]: { ...current[event.id], startsAt, endsAt }
    }));
    moveEvent({
      id: event.id,
      startsAt: next.startsAt,
      endsAt: next.endsAt
    });
  };

  const handleTimedDrop = (day: Date, clientY: number, columnTop: number) => {
    const drag = dragRef.current;
    if (!drag) return;
    const event = displayEvents.find((item) => item.id === drag.id);
    if (!event) return;
    suppressClickRef.current = true;
    const offsetPx = clientY - columnTop;
    const minutes = snapMinutes(
      HOUR_START * 60 + (offsetPx / SLOT_PX) * 60 - drag.grabOffsetMin
    );
    const clamped = Math.min(
      (HOUR_END - 1) * 60,
      Math.max(HOUR_START * 60, minutes)
    );
    applyMove(
      event,
      moveEventKeepingDuration(
        new Date(event.startsAt),
        new Date(event.endsAt),
        day,
        clamped
      )
    );
    dragRef.current = null;
  };

  const handleDayDrop = (day: Date) => {
    const drag = dragRef.current;
    if (!drag) return;
    const event = displayEvents.find((item) => item.id === drag.id);
    if (!event) return;
    suppressClickRef.current = true;
    applyMove(
      event,
      moveEventToDayKeepClock(
        new Date(event.startsAt),
        new Date(event.endsAt),
        day
      )
    );
    dragRef.current = null;
  };

  const beginDrag = (
    event: CalendarEventItem,
    clientY: number,
    blockTop: number
  ) => {
    const grabOffsetMin = ((clientY - blockTop) / SLOT_PX) * 60;
    dragRef.current = { id: event.id, grabOffsetMin };
  };

  const submitDraft = (): void => {
    if (!draft) return;
    const title = draft.title.trim();
    if (!title) {
      toast.error('Title is required');
      return;
    }
    const startsAt = fromLocalDateTimeInput(draft.startsAt);
    const endsAt = fromLocalDateTimeInput(draft.endsAt);
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
      toast.error('Pick a valid time');
      return;
    }
    const color = draft.color.slice(0, 7);
    if (draft.id) {
      saveEvent({
        id: draft.id,
        title,
        description: draft.description.trim() || null,
        startsAt,
        endsAt,
        attendeeIds: draft.attendeeIds,
        color
      });
      return;
    }
    createEvent({
      title,
      description: draft.description.trim() || undefined,
      startsAt,
      endsAt,
      attendeeIds: draft.attendeeIds,
      color
    });
  };

  return (
    <>
      <WorkspacePageShell
        title="Calendar"
        actions={
          <CalendarToolbar
            focusDate={focus}
            view={view}
          >
            <CalendarConnectSettings
              connections={connections}
              mailAutomation={mailAutomation}
            />
            <Button
              type="button"
              size="sm"
              className={TOOLBAR_BUTTON}
              onClick={() => openCreateNow(new Date())}
            >
              New event
            </Button>
          </CalendarToolbar>
        }
      >
        <div className="min-h-full">
          {view === 'month' ? (
            <MonthGrid
              days={days}
              focus={focus}
              events={displayEvents}
              now={now}
              onOpenEvent={openEvent}
              onCreateDay={(day) => openCreateNow(day)}
              onDragStart={beginDrag}
              onDropDay={handleDayDrop}
            />
          ) : (
            <div
              className={cn(
                'grid min-w-[320px]',
                view === 'day'
                  ? 'grid-cols-[4rem_minmax(0,1fr)]'
                  : 'min-w-[720px] grid-cols-[4rem_repeat(7,minmax(0,1fr))]'
              )}
            >
              <div className="sticky top-0 z-20 border-b border-border/60 bg-background" />
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
                        'mt-0.5 font-display text-lg leading-none',
                        isToday && 'text-[#f85919]'
                      )}
                    >
                      {day.getDate()}
                    </p>
                  </div>
                );
              })}

              <div className="relative">
                {Array.from({ length: HOURS }, (_, index) => (
                  <div
                    key={index}
                    className="border-b border-border/40 pr-2 text-right font-mono text-[10px] text-muted-foreground"
                    style={{ height: SLOT_PX }}
                  >
                    <span className="-translate-y-1.5 block">
                      {formatHour(HOUR_START + index)}
                    </span>
                  </div>
                ))}
              </div>

              {days.map((day) => {
                const work = workingRange(businessHours, dayEnumForDate(day));
                const columnEvents = displayEvents.filter((event) => {
                  const start = new Date(event.startsAt);
                  return start.toDateString() === day.toDateString();
                });
                return (
                  <div
                    key={`${day.toISOString()}-col`}
                    className="relative border-l border-border/60"
                    style={{ height: HOURS * SLOT_PX }}
                    onClick={(event) => {
                      const target = event.currentTarget;
                      openCreateAt(
                        day,
                        event.clientY,
                        target.getBoundingClientRect().top
                      );
                    }}
                    onDragOver={(event) => {
                      event.preventDefault();
                      event.dataTransfer.dropEffect = 'move';
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      handleTimedDrop(
                        day,
                        event.clientY,
                        event.currentTarget.getBoundingClientRect().top
                      );
                    }}
                  >
                    {work ? (
                      <div
                        className="pointer-events-none absolute inset-x-0 bg-[#f85919]/[0.06]"
                        style={{
                          top:
                            ((work.startMin - HOUR_START * 60) / 60) * SLOT_PX,
                          height: ((work.endMin - work.startMin) / 60) * SLOT_PX
                        }}
                      />
                    ) : null}
                    {Array.from({ length: HOURS }, (_, index) => (
                      <div
                        key={index}
                        className="border-b border-border/30"
                        style={{ height: SLOT_PX }}
                      />
                    ))}
                    {columnEvents.map((event) => {
                      const layout = eventLayout(event);
                      if (layout.hidden) return null;
                      const color = event.color || DEFAULT_EVENT_COLOR;
                      return (
                        <button
                          key={event.id}
                          type="button"
                          draggable
                          className="absolute inset-x-1 z-10 cursor-grab overflow-hidden rounded-lg px-1.5 py-1 text-left active:cursor-grabbing"
                          style={{
                            top: layout.top,
                            height: layout.height,
                            backgroundColor: color,
                            color: eventInkColor(color)
                          }}
                          onDragStart={(dragEvent) => {
                            dragEvent.stopPropagation();
                            dragEvent.dataTransfer.setData(
                              EVENT_DRAG_MIME,
                              event.id
                            );
                            dragEvent.dataTransfer.setData(
                              'text/plain',
                              event.id
                            );
                            dragEvent.dataTransfer.effectAllowed = 'move';
                            beginDrag(
                              event,
                              dragEvent.clientY,
                              dragEvent.currentTarget.getBoundingClientRect()
                                .top
                            );
                          }}
                          onDragEnd={() => {
                            dragRef.current = null;
                          }}
                          onClick={(click) => {
                            click.stopPropagation();
                            openEvent(event);
                          }}
                        >
                          <p className="truncate font-mono text-[11px] font-medium">
                            {event.title}
                          </p>
                          <p className="truncate font-mono text-[10px] opacity-80">
                            {new Date(event.startsAt).toLocaleTimeString([], {
                              hour: 'numeric',
                              minute: '2-digit'
                            })}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </WorkspacePageShell>

      <Dialog
        open={draft !== null}
        onOpenChange={(open) => {
          if (!open) setDraft(null);
        }}
      >
        <DialogContent className="rounded-lg sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{draft?.id ? 'Event' : 'New event'}</DialogTitle>
          </DialogHeader>
          {draft ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="cal-title">Title</Label>
                <Input
                  id="cal-title"
                  value={draft.title}
                  onChange={(event) =>
                    setDraft((current) =>
                      current
                        ? { ...current, title: event.target.value }
                        : current
                    )
                  }
                  className="rounded-lg"
                  placeholder="1:1, standup, customer call…"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label htmlFor="cal-start">Starts</Label>
                  <Input
                    id="cal-start"
                    type="datetime-local"
                    value={draft.startsAt}
                    onChange={(event) =>
                      setDraft((current) =>
                        current
                          ? { ...current, startsAt: event.target.value }
                          : current
                      )
                    }
                    className="rounded-lg font-mono text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cal-end">Ends</Label>
                  <Input
                    id="cal-end"
                    type="datetime-local"
                    value={draft.endsAt}
                    onChange={(event) =>
                      setDraft((current) =>
                        current
                          ? { ...current, endsAt: event.target.value }
                          : current
                      )
                    }
                    className="rounded-lg font-mono text-xs"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Color</Label>
                <div className="flex flex-wrap items-center gap-2">
                  <ColorPicker
                    value={draft.color}
                    onChange={(color) =>
                      setDraft((current) =>
                        current ? { ...current, color } : current
                      )
                    }
                    className="size-7 rounded-lg border"
                    title="Open full palette"
                  />
                  {CALENDAR_EVENT_COLORS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() =>
                        setDraft((current) =>
                          current ? { ...current, color: preset } : current
                        )
                      }
                      className="size-7 rounded-lg ring-offset-background transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      style={{
                        backgroundColor: preset,
                        boxShadow:
                          draft.color === preset
                            ? `0 0 0 2px ${preset}`
                            : undefined
                      }}
                      aria-label={preset}
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cal-notes">Notes</Label>
                <Textarea
                  id="cal-notes"
                  value={draft.description}
                  onChange={(event) =>
                    setDraft((current) =>
                      current
                        ? { ...current, description: event.target.value }
                        : current
                    )
                  }
                  rows={3}
                  className="rounded-lg"
                  placeholder="Agenda, link, or context…"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Busy</Label>
                <div className="max-h-36 space-y-1 overflow-y-auto border border-border/60 p-2">
                  {teamMembers.map((member) => {
                    const checked = draft.attendeeIds.includes(member.id);
                    return (
                      <label
                        key={member.id}
                        className="flex cursor-pointer items-center gap-2 px-1 py-1 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            setDraft((current) => {
                              if (!current) return current;
                              const next = checked
                                ? current.attendeeIds.filter(
                                    (id) => id !== member.id
                                  )
                                : [...current.attendeeIds, member.id];
                              return { ...current, attendeeIds: next };
                            });
                          }}
                        />
                        <span className="truncate">{member.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}
          <DialogFooter className="gap-2 sm:justify-between">
            {draft?.id ? (
              <Button
                type="button"
                variant="outline"
                className="rounded-lg font-mono text-destructive"
                disabled={pending}
                onClick={() => {
                  if (draft.id) removeEvent({ id: draft.id });
                }}
              >
                Delete
              </Button>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 px-3 font-mono text-xs font-medium normal-case tracking-normal"
                disabled={pending}
                onClick={() => setDraft(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                className="h-8 px-3 font-mono text-xs font-medium normal-case tracking-normal"
                disabled={pending}
                onClick={submitDraft}
              >
                {draft?.id ? 'Save' : 'Create'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function MonthGrid({
  days,
  focus,
  events,
  now,
  onOpenEvent,
  onCreateDay,
  onDragStart,
  onDropDay
}: {
  days: Date[];
  focus: Date;
  events: CalendarEventItem[];
  now: Date;
  onOpenEvent: (event: CalendarEventItem) => void;
  onCreateDay: (day: Date) => void;
  onDragStart: (
    event: CalendarEventItem,
    clientY: number,
    blockTop: number
  ) => void;
  onDropDay: (day: Date) => void;
}): React.JSX.Element {
  const eventsByDay = new Map<string, CalendarEventItem[]>();
  for (const event of events) {
    const key = new Date(event.startsAt).toDateString();
    const list = eventsByDay.get(key);
    if (list) {
      list.push(event);
    } else {
      eventsByDay.set(key, [event]);
    }
  }

  return (
    <div className="grid min-h-full grid-cols-7 grid-rows-[auto_repeat(6,minmax(7rem,1fr))]">
      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((label) => (
        <div
          key={label}
          className="border-b border-border/60 px-2 py-2 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground"
        >
          {label}
        </div>
      ))}
      {days.map((day) => {
        const inMonth = day.getMonth() === focus.getMonth();
        const isToday = day.toDateString() === now.toDateString();
        const dayEvents = eventsByDay.get(day.toDateString()) ?? [];
        const visible = dayEvents.slice(0, 3);
        const extra = dayEvents.length - visible.length;
        return (
          <button
            key={day.toISOString()}
            type="button"
            className={cn(
              'flex min-h-[7rem] flex-col gap-1 border-b border-l border-border/50 p-2 text-left',
              !inMonth && 'bg-muted/20 text-muted-foreground'
            )}
            onClick={() => onCreateDay(day)}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = 'move';
            }}
            onDrop={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onDropDay(day);
            }}
          >
            <span
              className={cn(
                'font-display text-sm leading-none',
                isToday && 'text-[#f85919]'
              )}
            >
              {day.getDate()}
            </span>
            <div className="flex min-h-0 flex-1 flex-col gap-0.5">
              {visible.map((event) => {
                const color = event.color || DEFAULT_EVENT_COLOR;
                return (
                  <span
                    key={event.id}
                    role="link"
                    tabIndex={0}
                    draggable
                    className="cursor-grab truncate px-1 py-0.5 font-mono text-[10px] active:cursor-grabbing"
                    style={{
                      backgroundColor: color,
                      color: eventInkColor(color)
                    }}
                    onDragStart={(dragEvent) => {
                      dragEvent.stopPropagation();
                      dragEvent.dataTransfer.setData(EVENT_DRAG_MIME, event.id);
                      dragEvent.dataTransfer.setData('text/plain', event.id);
                      dragEvent.dataTransfer.effectAllowed = 'move';
                      onDragStart(
                        event,
                        dragEvent.clientY,
                        dragEvent.currentTarget.getBoundingClientRect().top
                      );
                    }}
                    onClick={(click) => {
                      click.stopPropagation();
                      onOpenEvent(event);
                    }}
                    onKeyDown={(keyEvent) => {
                      if (keyEvent.key === 'Enter' || keyEvent.key === ' ') {
                        keyEvent.preventDefault();
                        keyEvent.stopPropagation();
                        onOpenEvent(event);
                      }
                    }}
                  >
                    {event.title}
                  </span>
                );
              })}
              {extra > 0 ? (
                <span className="font-mono text-[10px] text-muted-foreground">
                  +{extra}
                </span>
              ) : null}
            </div>
          </button>
        );
      })}
    </div>
  );
}

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';

import { createCalendarEvent } from '@/actions/calendar/create-calendar-event';
import { updateCalendarEvent } from '@/actions/calendar/update-calendar-event';
import {
  CalendarConnectedLogos,
  CalendarConnectSettings
} from '@/components/dashboard/calendar/calendar-connect-settings';
import {
  CalendarTimelineGrid,
  EVENT_DRAG_MIME,
  TIMELINE_SLOT_PX,
  type CreateRange,
  type MoveDragState
} from '@/components/dashboard/calendar/calendar-timeline-grid';
import {
  CalendarToolbar,
  TOOLBAR_BUTTON
} from '@/components/dashboard/calendar/calendar-toolbar';
import {
  EVENT_PICKER_SURFACE,
  EventDateTimeChip
} from '@/components/dashboard/calendar/event-datetime-chip';
import { EventDetailSidebar } from '@/components/dashboard/calendar/event-detail-sidebar';
import {
  QUICK_CREATE_BODY_CLASS,
  QUICK_CREATE_CHIP_CLASS,
  QUICK_CREATE_TITLE_CLASS,
  QuickCreateDialogContent,
  QuickCreateFooter
} from '@/components/dashboard/quick-create-dialog';
import { WorkspacePageShell } from '@/components/dashboard/workspace-page-shell';
import { Button } from '@/components/ui/button';
import { ColorPicker } from '@/components/ui/color-picker';
import { Dialog } from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
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
  startOfWeekMonday,
  toLocalDateTimeInput,
  type CalendarView
} from '@/lib/calendar/calendar-view';
import { cn } from '@/lib/utils';
import type { WorkHoursDto } from '@/types/dtos/work-hours-dto';

type Draft = {
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
  mailAutomation,
  initialEventId
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
  initialEventId?: string | null;
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
  const [createDraft, setCreateDraft] = React.useState<Draft | null>(null);
  const [selectedEventId, setSelectedEventId] = React.useState<string | null>(
    initialEventId ?? null
  );
  const [patches, setPatches] = React.useState<Record<string, EventPatch>>({});
  const dragRef = React.useRef<MoveDragState | null>(null);
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

  const selectedEvent = React.useMemo(
    () => displayEvents.find((event) => event.id === selectedEventId) ?? null,
    [displayEvents, selectedEventId]
  );

  React.useEffect(() => {
    if (initialEventId) setSelectedEventId(initialEventId);
  }, [initialEventId]);

  const { execute: createEvent, isExecuting: creating } = useAction(
    createCalendarEvent,
    {
      onSuccess: ({ data }) => {
        toast.success('Event created');
        setCreateDraft(null);
        if (data?.id) setSelectedEventId(data.id);
        router.refresh();
      },
      onError: ({ error }) => {
        toast.error(error.serverError || 'Could not create event');
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

  const pending = creating || moving;

  const openCreateRange = (range: CreateRange): void => {
    setSelectedEventId(null);
    setCreateDraft(
      draftFromWindow({ start: range.start, end: range.end }, currentUserId)
    );
  };

  const openCreateNow = (day?: Date): void => {
    setSelectedEventId(null);
    setCreateDraft(
      draftFromWindow(defaultEventWindow(day ?? new Date()), currentUserId)
    );
  };

  const openEvent = (event: CalendarEventItem): void => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    setCreateDraft(null);
    setSelectedEventId(event.id);
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

  const handleTimedDrop = (day: Date, startMinutesFromMidnight: number) => {
    const drag = dragRef.current;
    if (!drag) return;
    const event = displayEvents.find((item) => item.id === drag.id);
    if (!event) return;
    suppressClickRef.current = true;
    applyMove(
      event,
      moveEventKeepingDuration(
        new Date(event.startsAt),
        new Date(event.endsAt),
        day,
        startMinutesFromMidnight
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
    // Month grid still needs local grab math; week timeline sets the ref itself.
    const grabOffsetMin = ((clientY - blockTop) / TIMELINE_SLOT_PX) * 60;
    dragRef.current = { id: event.id, grabOffsetMin };
  };

  const submitCreate = (): void => {
    if (!createDraft) return;
    const title = createDraft.title.trim();
    if (!title) {
      toast.error('Title is required');
      return;
    }
    const startsAt = fromLocalDateTimeInput(createDraft.startsAt);
    const endsAt = fromLocalDateTimeInput(createDraft.endsAt);
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
      toast.error('Pick a valid time');
      return;
    }
    createEvent({
      title,
      description: createDraft.description.trim() || undefined,
      startsAt,
      endsAt,
      attendeeIds: createDraft.attendeeIds,
      color: createDraft.color.slice(0, 7)
    });
  };

  return (
    <>
      <div className="flex h-full min-h-0 flex-1 overflow-hidden">
        <div className="min-w-0 flex-1 overflow-hidden">
          <WorkspacePageShell
            title={
              <span className="inline-flex items-center gap-2">
                Calendar
                <CalendarConnectedLogos connections={connections} />
              </span>
            }
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
                  selectedEventId={selectedEventId}
                  onOpenEvent={openEvent}
                  onCreateDay={(day) => openCreateNow(day)}
                  onDragStart={beginDrag}
                  onDropDay={handleDayDrop}
                />
              ) : (
                <CalendarTimelineGrid
                  days={days}
                  events={displayEvents}
                  teamMembers={teamMembers}
                  businessHours={businessHours}
                  selectedEventId={selectedEventId}
                  onOpenEvent={openEvent}
                  onCreateRange={openCreateRange}
                  onBeginMove={(event) => {
                    if (!dragRef.current || dragRef.current.id !== event.id) {
                      dragRef.current = {
                        id: event.id,
                        grabOffsetMin: 0
                      };
                    }
                  }}
                  onTimedDrop={handleTimedDrop}
                  moveDragRef={dragRef}
                />
              )}
            </div>
          </WorkspacePageShell>
        </div>

        <div
          className={cn(
            'shrink-0 overflow-hidden border-l border-border/50 transition-[width] duration-300 ease-out',
            selectedEvent
              ? 'w-96 max-lg:fixed max-lg:inset-y-0 max-lg:right-0 max-lg:z-50 max-lg:w-full max-lg:border-l-0'
              : 'w-0 border-l-0'
          )}
        >
          {selectedEvent ? (
            <div className="h-full w-96 max-lg:w-full">
              <EventDetailSidebar
                event={selectedEvent}
                teamMembers={teamMembers}
                events={displayEvents}
                onClose={() => setSelectedEventId(null)}
                onSelectEvent={(next) => setSelectedEventId(next.id)}
                onSaved={() => router.refresh()}
                onDeleted={() => {
                  setSelectedEventId(null);
                  router.refresh();
                }}
              />
            </div>
          ) : null}
        </div>
      </div>

      <Dialog
        open={createDraft !== null}
        onOpenChange={(open) => {
          if (!open) setCreateDraft(null);
        }}
      >
        <QuickCreateDialogContent
          title="New event"
          description="Create a calendar event."
        >
          {createDraft ? (
            <div className="flex min-h-0 flex-1 flex-col px-5 pt-4">
              <input
                id="cal-title"
                value={createDraft.title}
                onChange={(event) =>
                  setCreateDraft((current) =>
                    current
                      ? { ...current, title: event.target.value }
                      : current
                  )
                }
                className={cn(QUICK_CREATE_TITLE_CLASS, 'py-1')}
                placeholder="Event title"
                autoFocus
              />
              <textarea
                id="cal-notes"
                value={createDraft.description}
                onChange={(event) =>
                  setCreateDraft((current) =>
                    current
                      ? { ...current, description: event.target.value }
                      : current
                  )
                }
                rows={3}
                className={cn(QUICK_CREATE_BODY_CLASS, 'mt-1')}
                placeholder="Add notes…"
              />
              <div className="mt-4 flex flex-wrap items-center gap-1.5">
                <EventDateTimeChip
                  label="Starts"
                  value={createDraft.startsAt}
                  onChange={(startsAt) =>
                    setCreateDraft((current) =>
                      current ? { ...current, startsAt } : current
                    )
                  }
                />
                <EventDateTimeChip
                  label="Ends"
                  value={createDraft.endsAt}
                  onChange={(endsAt) =>
                    setCreateDraft((current) =>
                      current ? { ...current, endsAt } : current
                    )
                  }
                />
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className={QUICK_CREATE_CHIP_CLASS}
                    >
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: createDraft.color }}
                      />
                      Color
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    className={cn(EVENT_PICKER_SURFACE, 'space-y-2')}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <ColorPicker
                        value={createDraft.color}
                        onChange={(color) =>
                          setCreateDraft((current) =>
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
                            setCreateDraft((current) =>
                              current ? { ...current, color: preset } : current
                            )
                          }
                          className="size-7 rounded-lg ring-offset-background transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          style={{
                            backgroundColor: preset,
                            boxShadow:
                              createDraft.color === preset
                                ? `0 0 0 2px ${preset}`
                                : undefined
                          }}
                          aria-label={preset}
                        />
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className={QUICK_CREATE_CHIP_CLASS}
                    >
                      {createDraft.attendeeIds.length > 0
                        ? `${createDraft.attendeeIds.length} teammates`
                        : 'Teammates'}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    className={cn(
                      EVENT_PICKER_SURFACE,
                      'max-h-56 w-56 overflow-y-auto p-1'
                    )}
                  >
                    {teamMembers.map((member) => {
                      const checked = createDraft.attendeeIds.includes(
                        member.id
                      );
                      return (
                        <label
                          key={member.id}
                          className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-accent"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              setCreateDraft((current) => {
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
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          ) : null}
          <QuickCreateFooter>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 px-3 font-mono text-xs font-medium normal-case tracking-normal"
                disabled={pending}
                onClick={() => setCreateDraft(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                className="h-8 px-3 font-mono text-xs font-medium normal-case tracking-normal"
                disabled={pending}
                onClick={submitCreate}
              >
                Create event
              </Button>
            </div>
          </QuickCreateFooter>
        </QuickCreateDialogContent>
      </Dialog>
    </>
  );
}

function MonthGrid({
  days,
  focus,
  events,
  now,
  selectedEventId,
  onOpenEvent,
  onCreateDay,
  onDragStart,
  onDropDay
}: {
  days: Date[];
  focus: Date;
  events: CalendarEventItem[];
  now: Date;
  selectedEventId: string | null;
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
                    className={cn(
                      'cursor-grab truncate px-1 py-0.5 font-mono text-[10px] active:cursor-grabbing',
                      selectedEventId === event.id &&
                        'ring-1 ring-foreground/40'
                    )}
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

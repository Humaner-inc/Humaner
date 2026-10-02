'use client';

import * as React from 'react';
import { CaretDown } from '@phosphor-icons/react/dist/ssr/CaretDown';
import { CaretUp } from '@phosphor-icons/react/dist/ssr/CaretUp';
import { Clock } from '@phosphor-icons/react/dist/ssr/Clock';
import { Users } from '@phosphor-icons/react/dist/ssr/Users';
import { X } from '@phosphor-icons/react/dist/ssr/X';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';

import { deleteCalendarEvent } from '@/actions/calendar/delete-calendar-event';
import { updateCalendarEvent } from '@/actions/calendar/update-calendar-event';
import {
  EVENT_PICKER_SURFACE,
  EventDateTimeChip
} from '@/components/dashboard/calendar/event-datetime-chip';
import { QUICK_CREATE_CHIP_CLASS } from '@/components/dashboard/quick-create-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ColorPicker } from '@/components/ui/color-picker';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import type {
  CalendarEventItem,
  CalendarTeamMember
} from '@/data/calendar/get-workspace-calendar';
import {
  CALENDAR_EVENT_COLORS,
  DEFAULT_EVENT_COLOR,
  fromLocalDateTimeInput,
  toLocalDateTimeInput
} from '@/lib/calendar/calendar-view';
import { cn, getInitials } from '@/lib/utils';

type Draft = {
  id: string;
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  attendeeIds: string[];
  color: string;
};

function draftFromEvent(event: CalendarEventItem): Draft {
  return {
    id: event.id,
    title: event.title,
    description: event.description ?? '',
    startsAt: toLocalDateTimeInput(new Date(event.startsAt)),
    endsAt: toLocalDateTimeInput(new Date(event.endsAt)),
    attendeeIds: event.attendeeIds.length
      ? event.attendeeIds
      : [event.createdById],
    color: event.color || DEFAULT_EVENT_COLOR
  };
}

export function EventDetailSidebar({
  event,
  teamMembers,
  events,
  onClose,
  onSelectEvent,
  onSaved,
  onDeleted
}: {
  event: CalendarEventItem;
  teamMembers: CalendarTeamMember[];
  events: CalendarEventItem[];
  onClose: () => void;
  onSelectEvent: (event: CalendarEventItem) => void;
  onSaved: () => void;
  onDeleted: () => void;
}): React.JSX.Element {
  const [draft, setDraft] = React.useState(() => draftFromEvent(event));

  React.useEffect(() => {
    setDraft(draftFromEvent(event));
  }, [event]);

  const { execute: saveEvent, isExecuting: saving } = useAction(
    updateCalendarEvent,
    {
      onSuccess: () => {
        toast.success('Event updated');
        onSaved();
      },
      onError: ({ error }) => {
        toast.error(error.serverError || 'Could not update event');
      }
    }
  );
  const { execute: removeEvent, isExecuting: removing } = useAction(
    deleteCalendarEvent,
    {
      onSuccess: () => {
        toast.success('Event deleted');
        onDeleted();
      },
      onError: ({ error }) => {
        toast.error(error.serverError || 'Could not delete event');
      }
    }
  );

  const pending = saving || removing;
  const ordered = React.useMemo(
    () =>
      [...events].toSorted(
        (a, b) =>
          new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
      ),
    [events]
  );
  const index = ordered.findIndex((item) => item.id === event.id);

  const toggleAttendee = (memberId: string): void => {
    setDraft((current) => {
      const checked = current.attendeeIds.includes(memberId);
      const attendeeIds = checked
        ? current.attendeeIds.filter((id) => id !== memberId)
        : [...current.attendeeIds, memberId];
      return { ...current, attendeeIds };
    });
  };

  const submit = (): void => {
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
    saveEvent({
      id: draft.id,
      title,
      description: draft.description.trim() || null,
      startsAt,
      endsAt,
      attendeeIds: draft.attendeeIds,
      color: draft.color.slice(0, 7)
    });
  };

  const selectedMembers = teamMembers.filter((member) =>
    draft.attendeeIds.includes(member.id)
  );

  return (
    <aside className="flex h-full min-h-0 w-full flex-col bg-background">
      <div className="flex h-12 shrink-0 items-center gap-1 border-b border-border/50 px-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 text-muted-foreground"
          disabled={index <= 0}
          aria-label="Previous event"
          onClick={() => {
            const prev = ordered[index - 1];
            if (prev) onSelectEvent(prev);
          }}
        >
          <CaretUp className="size-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 text-muted-foreground"
          disabled={index < 0 || index >= ordered.length - 1}
          aria-label="Next event"
          onClick={() => {
            const next = ordered[index + 1];
            if (next) onSelectEvent(next);
          }}
        >
          <CaretDown className="size-3.5" />
        </Button>
        <div className="flex-1" />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 text-muted-foreground"
          aria-label="Close"
          onClick={onClose}
        >
          <X className="size-4" />
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <input
          value={draft.title}
          onChange={(change) =>
            setDraft((current) => ({ ...current, title: change.target.value }))
          }
          className="w-full bg-transparent font-display text-xl tracking-tight text-foreground outline-none placeholder:text-muted-foreground/50"
          placeholder="Event title"
        />
        <textarea
          value={draft.description}
          onChange={(change) =>
            setDraft((current) => ({
              ...current,
              description: change.target.value
            }))
          }
          rows={2}
          className="mt-2 w-full resize-none bg-transparent text-sm text-muted-foreground outline-none placeholder:text-muted-foreground/45"
          placeholder="Add notes…"
        />

        <div className="mt-5">
          <p className="mb-2 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            <Users className="size-3" />
            Team
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex -space-x-2">
              {selectedMembers.slice(0, 4).map((member) => (
                <Avatar
                  key={member.id}
                  className="size-8 ring-2 ring-background"
                  title={member.name}
                >
                  {member.image ? (
                    <AvatarImage
                      src={member.image}
                      alt=""
                    />
                  ) : null}
                  <AvatarFallback className="text-[10px]">
                    {getInitials(member.name)}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(QUICK_CREATE_CHIP_CLASS, 'h-8')}
                >
                  {draft.attendeeIds.length > 0
                    ? `${draft.attendeeIds.length} members`
                    : 'Add teammates'}
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
                  const checked = draft.attendeeIds.includes(member.id);
                  return (
                    <label
                      key={member.id}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-accent"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleAttendee(member.id)}
                      />
                      <Avatar className="size-5">
                        {member.image ? (
                          <AvatarImage
                            src={member.image}
                            alt=""
                          />
                        ) : null}
                        <AvatarFallback className="text-[8px]">
                          {getInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate">{member.name}</span>
                    </label>
                  );
                })}
              </PopoverContent>
            </Popover>
          </div>
          {selectedMembers.length > 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">
              {selectedMembers
                .slice(0, 2)
                .map((member) => member.name)
                .join(', ')}
              {selectedMembers.length > 2
                ? ` +${selectedMembers.length - 2}`
                : ''}
            </p>
          ) : null}
        </div>

        <div className="mt-5 space-y-2">
          <p className="mb-2 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            <Clock className="size-3" />
            When
          </p>
          <div className="flex flex-wrap gap-1.5">
            <EventDateTimeChip
              label="Start"
              value={draft.startsAt}
              onChange={(startsAt) =>
                setDraft((current) => ({ ...current, startsAt }))
              }
            />
            <EventDateTimeChip
              label="End"
              value={draft.endsAt}
              onChange={(endsAt) =>
                setDraft((current) => ({ ...current, endsAt }))
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
                    style={{ backgroundColor: draft.color }}
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
                    value={draft.color}
                    onChange={(color) =>
                      setDraft((current) => ({ ...current, color }))
                    }
                    className="size-7 rounded-lg border"
                    title="Open full palette"
                  />
                  {CALENDAR_EVENT_COLORS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() =>
                        setDraft((current) => ({ ...current, color: preset }))
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
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-2 border-t border-border/50 bg-background px-4 py-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 px-3 font-mono text-muted-foreground transition-colors hover:!border-red-500/50 hover:!bg-red-500/10 hover:!text-red-500 dark:hover:!border-red-400/50 dark:hover:!bg-red-400/15 dark:hover:!text-red-400"
          disabled={pending}
          onClick={() => removeEvent({ id: draft.id })}
        >
          Delete
        </Button>
        <Button
          type="button"
          size="sm"
          className="h-8 px-3 font-mono text-xs font-medium normal-case tracking-normal"
          disabled={pending}
          onClick={submit}
        >
          Save
        </Button>
      </div>
    </aside>
  );
}

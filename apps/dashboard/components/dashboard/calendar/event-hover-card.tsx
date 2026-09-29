'use client';

import * as React from 'react';
import { Clock } from '@phosphor-icons/react/dist/ssr/Clock';
import { Users } from '@phosphor-icons/react/dist/ssr/Users';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type {
  CalendarEventItem,
  CalendarTeamMember
} from '@/data/calendar/get-workspace-calendar';
import { DEFAULT_EVENT_COLOR } from '@/lib/calendar/calendar-view';
import { cn, getInitials } from '@/lib/utils';

function formatRange(startsAt: string, endsAt: string): string {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const day = start.toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
  const startTime = start.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit'
  });
  const endTime = end.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit'
  });
  const hours = Math.max(
    0.25,
    Math.round(((end.getTime() - start.getTime()) / 3_600_000) * 4) / 4
  );
  const duration =
    hours >= 1
      ? `${hours % 1 === 0 ? hours : hours.toFixed(2).replace(/\.?0+$/, '')}h`
      : `${Math.round(hours * 60)}m`;
  return `${day} · ${startTime} – ${endTime} · ${duration}`;
}

export function EventHoverCard({
  event,
  teamMembers,
  className,
  style
}: {
  event: CalendarEventItem;
  teamMembers: CalendarTeamMember[];
  className?: string;
  style?: React.CSSProperties;
}): React.JSX.Element {
  const color = event.color || DEFAULT_EVENT_COLOR;
  const attendees = teamMembers.filter(
    (member) =>
      event.attendeeIds.includes(member.id) || member.id === event.createdById
  );
  const lead = attendees[0];

  return (
    <div
      role="tooltip"
      className={cn(
        'pointer-events-none z-50 w-72 rounded-xl border border-border/70 bg-background p-3 shadow-lg',
        className
      )}
      style={style}
    >
      <div className="flex items-start gap-2">
        <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
          {event.title}
        </p>
        <span
          className="mt-1.5 size-2 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
          aria-hidden
        />
      </div>
      <div className="mt-2 space-y-1.5 text-xs text-muted-foreground">
        <p className="flex items-start gap-2">
          <Clock className="mt-0.5 size-3.5 shrink-0" />
          <span>{formatRange(event.startsAt, event.endsAt)}</span>
        </p>
        {event.description ? (
          <p className="line-clamp-2 pl-5 text-muted-foreground/90">
            {event.description}
          </p>
        ) : null}
        {attendees.length > 0 ? (
          <p className="flex items-center gap-2">
            <Users className="size-3.5 shrink-0" />
            <span>
              {attendees.length === 1
                ? attendees[0].name
                : `${attendees.length} teammates`}
            </span>
          </p>
        ) : null}
      </div>
      {lead ? (
        <div className="mt-3 flex items-center gap-2 border-t border-border/60 pt-2.5">
          <div className="flex -space-x-2">
            {attendees.slice(0, 3).map((member) => (
              <Avatar
                key={member.id}
                className="size-6 ring-2 ring-background"
              >
                {member.image ? (
                  <AvatarImage
                    src={member.image}
                    alt=""
                  />
                ) : null}
                <AvatarFallback className="text-[9px]">
                  {getInitials(member.name)}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
          <p className="truncate text-xs text-muted-foreground">
            {lead.name}
            {attendees.length > 1 ? ` +${attendees.length - 1}` : ''}
          </p>
        </div>
      ) : null}
    </div>
  );
}

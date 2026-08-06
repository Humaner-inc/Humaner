import * as React from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

import {
  StatusGlyph,
  type StatusGlyphKind
} from '@/components/ui/status-glyph';
import { MODE_COLOR } from '@/lib/desk/escalation-framework';
import { formatTicketRef } from '@/lib/desk/ticket-ref';
import { URGENCY_LABELS } from '@/lib/handoff/handoff-inbox';
import { cn } from '@/lib/utils';
import type {
  HandoffTicketStatus,
  HandoffTicketUrgency
} from '@/types/handoff-ticket';

export type DeskTicketPreview = {
  id: string;
  ticketNumber: number;
  subject: string;
  status: HandoffTicketStatus;
  urgency: HandoffTicketUrgency;
  visitorEmail: string | null;
  visitorFirstName: string | null;
  visitorLastName: string | null;
  summary: string;
  note: string | null;
  updatedAt: string;
};

export const DESK_TICKET_STATUS_LABELS: Record<HandoffTicketStatus, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In progress',
  RESOLVED: 'Solved',
  CLOSED: 'Closed'
};

/** Shared height/padding for status + assignee chips in ticket previews. */
export const DESK_TICKET_ACTION_CHIP_CLASSNAME =
  'inline-flex h-6 min-h-6 max-h-6 shrink-0 items-center gap-1 rounded-none border border-border/60 bg-background px-1.5 py-0 text-[10px] font-medium leading-none text-foreground shadow-none';

const URGENCY_COLOR: Record<HandoffTicketUrgency, string> = {
  HIGH: MODE_COLOR.LIVE,
  MEDIUM: MODE_COLOR.PRIORITY,
  LOW: MODE_COLOR.SELF_RESOLVING
};

export function ticketStatusToGlyph(
  status: HandoffTicketStatus
): StatusGlyphKind {
  switch (status) {
    case 'OPEN':
      return 'open';
    case 'IN_PROGRESS':
      return 'progress';
    case 'RESOLVED':
      return 'resolved';
    case 'CLOSED':
      return 'closed';
    default:
      return 'open';
  }
}

export function UrgencyCornerMark({
  urgency
}: {
  urgency: HandoffTicketUrgency;
}): React.JSX.Element {
  const fill = URGENCY_COLOR[urgency];

  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      className="pointer-events-none absolute left-0 top-0 z-[1] block"
      aria-label={`Urgency: ${URGENCY_LABELS[urgency]}`}
    >
      <title>{URGENCY_LABELS[urgency]}</title>
      <polygon
        points="0,0 16,0 0,16"
        fill={fill}
      />
    </svg>
  );
}

function visitorDisplayName(ticket: DeskTicketPreview): string {
  if (ticket.visitorFirstName) {
    return `${ticket.visitorFirstName}${
      ticket.visitorLastName ? ` ${ticket.visitorLastName}` : ''
    }`;
  }
  return ticket.visitorEmail ?? 'Visitor';
}

export type DeskTicketPreviewRowProps = {
  ticket: DeskTicketPreview;
  selected?: boolean;
  /** Extra muted meta after the relative time (e.g. " · yours"). */
  metaSuffix?: string;
  /** Optional actions rendered next to the status badge (e.g. assignee). */
  actions?: React.ReactNode;
  className?: string;
  href?: string;
  onSelect?: () => void;
};

export function DeskTicketPreviewRow({
  ticket,
  selected = false,
  metaSuffix,
  actions,
  className,
  href,
  onSelect
}: DeskTicketPreviewRowProps): React.JSX.Element {
  const preview = ticket.note?.trim() || ticket.summary || 'No preview';
  const statusBadge = (
    <span className={DESK_TICKET_ACTION_CHIP_CLASSNAME}>
      <StatusGlyph
        kind={ticketStatusToGlyph(ticket.status)}
        className="size-3 shrink-0"
      />
      {DESK_TICKET_STATUS_LABELS[ticket.status]}
    </span>
  );

  const body = (
    <div className="min-w-0 flex-1">
      <div className="flex items-center justify-between gap-2">
        <p className={cn('truncate text-xs font-medium', actions && 'pr-36')}>
          {visitorDisplayName(ticket)}
        </p>
        {actions ? null : statusBadge}
      </div>
      <p className="mt-0.5 line-clamp-1 font-fellix text-[11px] text-foreground/90">
        <span className="mr-1 font-mono text-[10px] text-muted-foreground">
          {formatTicketRef(ticket.ticketNumber)}
        </span>
        {ticket.subject}
      </p>
      <p className="mt-0.5 line-clamp-1 text-[10px] text-muted-foreground">
        {preview}
        {' · '}
        {formatDistanceToNow(new Date(ticket.updatedAt), { addSuffix: true })}
        {metaSuffix}
      </p>
    </div>
  );

  const sharedClassName = cn(
    'relative flex w-full overflow-hidden px-3 py-2.5 text-left transition-colors',
    'hover:bg-muted/40',
    selected && 'bg-muted/50',
    className
  );

  const interactive = href ? (
    <Link
      href={href}
      className={sharedClassName}
    >
      <UrgencyCornerMark urgency={ticket.urgency} />
      {body}
    </Link>
  ) : (
    <button
      type="button"
      onClick={onSelect}
      className={sharedClassName}
    >
      <UrgencyCornerMark urgency={ticket.urgency} />
      {body}
    </button>
  );

  if (!actions) {
    return interactive;
  }

  return (
    <div className="group relative">
      {interactive}
      <div className="absolute right-3 top-2.5 z-10 flex items-center gap-1.5">
        {statusBadge}
        {actions}
      </div>
    </div>
  );
}

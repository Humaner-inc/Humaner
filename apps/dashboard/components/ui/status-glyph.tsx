import * as React from 'react';

import {
  SquircleStatusIcon,
  type SquircleStatusKind
} from '@/components/ui/squircle-status-icon';
import { cn } from '@/lib/utils';

export type StatusGlyphKind =
  | 'open'
  | 'unopened'
  | 'progress'
  | 'checking'
  | 'blocked'
  | 'cancelled'
  | 'resolved'
  | 'closed'
  | 'snoozed';

const GLYPH_TO_SQUIRCLE: Record<StatusGlyphKind, SquircleStatusKind> = {
  open: 'open',
  unopened: 'dashed',
  progress: 'progress',
  checking: 'checking',
  resolved: 'done',
  closed: 'idle',
  snoozed: 'dashed',
  blocked: 'blocked',
  cancelled: 'cancelled'
};

export function StatusGlyph({
  kind,
  className,
  color
}: {
  kind: StatusGlyphKind;
  className?: string;
  color?: string;
}): React.JSX.Element {
  return (
    <span
      className={cn('inline-flex shrink-0', className)}
      style={color ? { color } : undefined}
    >
      <SquircleStatusIcon
        kind={GLYPH_TO_SQUIRCLE[kind]}
        className={color ? 'text-current' : undefined}
      />
    </span>
  );
}

export function StatusGlyphMetricLabel({
  kind,
  label
}: {
  kind: StatusGlyphKind;
  label: string;
}): React.JSX.Element {
  return (
    <span className="inline-flex h-3.5 items-center gap-1.5 whitespace-nowrap">
      <StatusGlyph kind={kind} />
      <span className="font-info text-[9px] uppercase leading-none tracking-[0.08em] text-muted-foreground">
        {label}
      </span>
    </span>
  );
}

export function mailStatusToGlyph(status: string): StatusGlyphKind {
  switch (status.toUpperCase()) {
    case 'PENDING':
      return 'checking';
    case 'RESOLVED':
      return 'resolved';
    case 'CLOSED':
      return 'closed';
    case 'SNOOZED':
      return 'snoozed';
    default:
      return 'open';
  }
}

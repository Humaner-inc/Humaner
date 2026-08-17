import * as React from 'react';
import { CheckIcon, XIcon } from '@humaner/shared/icons';

import { cn } from '@/lib/utils';

export type StatusGlyphKind =
  | 'open'
  | 'unopened'
  | 'progress'
  | 'resolved'
  | 'closed'
  | 'snoozed';

export function StatusGlyph({
  kind,
  className
}: {
  kind: StatusGlyphKind;
  className?: string;
}): React.JSX.Element {
  if (kind === 'unopened') {
    return (
      <span
        className={cn(
          'inline-flex size-3.5 shrink-0 items-center justify-center text-info',
          className
        )}
        aria-hidden
      >
        <span className="size-2 rounded-full bg-current" />
      </span>
    );
  }

  if (kind === 'open') {
    return (
      <span
        className={cn(
          'inline-flex size-3.5 shrink-0 items-center justify-center text-info',
          className
        )}
        aria-hidden
      >
        <span className="size-2 rounded-full border-[1.5px] border-current" />
      </span>
    );
  }

  if (kind === 'progress') {
    return (
      <span
        className={cn(
          'inline-flex size-3.5 shrink-0 items-center justify-center text-warning',
          className
        )}
        aria-hidden
      >
        <span className="block h-0.5 w-2.5 rounded-full bg-current" />
      </span>
    );
  }

  if (kind === 'snoozed') {
    return (
      <span
        className={cn(
          'inline-flex size-3.5 shrink-0 items-center justify-center text-muted-foreground',
          className
        )}
        aria-hidden
      >
        <span className="size-2 rounded-full border border-dashed border-current" />
      </span>
    );
  }

  if (kind === 'closed') {
    return (
      <span
        className={cn(
          'inline-flex size-3.5 shrink-0 items-center justify-center text-muted-foreground',
          className
        )}
        aria-hidden
      >
        <XIcon className="size-3.5" />
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex size-3.5 shrink-0 items-center justify-center text-success',
        className
      )}
      aria-hidden
    >
      <CheckIcon className="size-3.5" />
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
      return 'progress';
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

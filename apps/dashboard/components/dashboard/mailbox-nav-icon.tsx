'use client';

import * as React from 'react';

import type { HumanerNavColor } from '@/lib/humaner-nav-colors';
import { cn } from '@/lib/utils';

export type { HumanerNavColor };

type PhosphorNavGlyph = React.ComponentType<{
  size?: number;
  weight?: 'regular' | 'fill';
  className?: string;
  style?: React.CSSProperties;
}>;

/**
 * Monochrome, Linear-style: one stroke weight, tone carries the state.
 * `color` stays on the API for callers that tint elsewhere (badges, chips).
 */
export function MailboxNavIcon({
  icon: Icon,
  active,
  className
}: {
  icon: PhosphorNavGlyph;
  active: boolean;
  color?: HumanerNavColor;
  className?: string;
}): React.JSX.Element {
  return (
    <Icon
      size={16}
      weight={active ? 'fill' : 'regular'}
      className={cn(
        'size-4 shrink-0 transition-colors',
        active
          ? 'text-sidebar-foreground'
          : 'text-sidebar-foreground/50 group-hover/nav:text-sidebar-foreground/80',
        className
      )}
    />
  );
}

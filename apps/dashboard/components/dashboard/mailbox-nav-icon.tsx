'use client';

import * as React from 'react';

import {
  HUMANER_NAV_COLORS,
  type HumanerNavColor
} from '@/lib/humaner-nav-colors';
import { cn } from '@/lib/utils';

export type { HumanerNavColor };

type PhosphorNavGlyph = React.ComponentType<{
  size?: number;
  weight?: 'regular' | 'fill';
  className?: string;
  style?: React.CSSProperties;
}>;

export function MailboxNavIcon({
  icon: Icon,
  active,
  color,
  className
}: {
  icon: PhosphorNavGlyph;
  active: boolean;
  color: HumanerNavColor;
  className?: string;
}): React.JSX.Element {
  return (
    <Icon
      size={16}
      weight={active ? 'fill' : 'regular'}
      className={cn(
        'size-4 shrink-0 transition-colors',
        !active &&
          'text-sidebar-foreground/50 group-hover/nav:text-sidebar-foreground',
        className
      )}
      style={
        active
          ? {
              color:
                color === HUMANER_NAV_COLORS.foreground ||
                color === HUMANER_NAV_COLORS.brand
                  ? 'hsl(var(--foreground))'
                  : color
            }
          : undefined
      }
    />
  );
}

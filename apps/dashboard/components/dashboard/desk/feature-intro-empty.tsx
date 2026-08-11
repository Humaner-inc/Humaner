'use client';

import * as React from 'react';

import { GlassFeatureIcon } from '@/components/ui/glass-feature-icon';
import { dashboardSurfaceClassName } from '@/lib/dashboard/surface-styles';
import { cn } from '@/lib/utils';

export type FeatureIntroEmptyProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  example?: string;
  children?: React.ReactNode;
  className?: string;
  /** Compact, borderless empty state (e.g. notifications panel). */
  compact?: boolean;
};

/**
 * Centered feature intro for empty desk pages — Linear Loops-style layout,
 * Humaner surfaces + Integrations glass icon tile.
 */
export function FeatureIntroEmpty({
  icon,
  title,
  description,
  example,
  children,
  className,
  compact = false
}: FeatureIntroEmptyProps): React.JSX.Element {
  return (
    <div
      role="region"
      aria-label={title}
      data-icon-hover=""
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact
          ? 'gap-3 px-4 py-6'
          : cn(
              'min-h-[22rem] gap-7 px-8 py-14 sm:px-12',
              dashboardSurfaceClassName
            ),
        className
      )}
    >
      <GlassFeatureIcon size={compact ? 'md' : 'lg'}>{icon}</GlassFeatureIcon>
      <div
        className={cn(
          'mx-auto flex w-full flex-col items-center text-center',
          compact ? 'max-w-xs gap-1.5' : 'max-w-md gap-3'
        )}
      >
        <h3 className={compact ? 'text-sm font-medium' : 'page-title'}>
          {title}
        </h3>
        <p
          className={cn(
            'leading-relaxed text-muted-foreground',
            compact ? 'text-xs' : 'text-sm'
          )}
        >
          {description}
        </p>
        {example ? (
          <p
            className={cn(
              'leading-relaxed text-muted-foreground/90',
              compact ? 'text-xs' : 'text-sm'
            )}
          >
            {example}
          </p>
        ) : null}
      </div>
      {children ? (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {children}
        </div>
      ) : null}
    </div>
  );
}

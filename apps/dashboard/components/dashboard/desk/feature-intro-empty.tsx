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
  className
}: FeatureIntroEmptyProps): React.JSX.Element {
  return (
    <div
      role="region"
      aria-label={title}
      className={cn(
        'flex min-h-[22rem] flex-col items-center justify-center gap-7 px-8 py-14 sm:px-12',
        dashboardSurfaceClassName,
        className
      )}
    >
      <GlassFeatureIcon>{icon}</GlassFeatureIcon>
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-3 text-center">
        <h3 className="page-title">{title}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
        {example ? (
          <p className="text-sm leading-relaxed text-muted-foreground/90">
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

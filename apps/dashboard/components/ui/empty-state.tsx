import * as React from 'react';

import { GlassFeatureIcon } from '@/components/ui/glass-feature-icon';
import { dashboardSurfaceClassName } from '@/lib/dashboard/surface-styles';
import { cn } from '@/lib/utils';

export type EmptyStateElement = HTMLDivElement;
export type EmptyStateProps = {
  title: string;
  description: string;
  icon: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  /** Skip glass tile when the caller already wraps the icon. */
  bareIcon?: boolean;
};
const EmptyState = React.forwardRef<EmptyStateElement, EmptyStateProps>(
  (
    {
      title,
      description,
      icon,
      children,
      className,
      bareIcon = false,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        role="region"
        aria-label={title}
        className={cn(
          'flex h-full flex-col items-center justify-center gap-7 px-8 py-12 sm:px-10 md:px-12',
          dashboardSurfaceClassName,
          className
        )}
        {...props}
      >
        {bareIcon ? icon : <GlassFeatureIcon>{icon}</GlassFeatureIcon>}
        <div className="mx-auto flex max-w-md flex-col items-center gap-3 text-balance text-center">
          <p className="page-title">{title}</p>
          <p className="font-sans text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
        {children}
      </div>
    );
  }
);
EmptyState.displayName = 'EmptyState';

export { EmptyState };

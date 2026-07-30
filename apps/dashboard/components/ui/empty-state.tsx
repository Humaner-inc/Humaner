import * as React from 'react';

import { dashboardSurfaceClassName } from '@/lib/dashboard/surface-styles';
import { cn } from '@/lib/utils';

export type EmptyStateElement = HTMLDivElement;
export type EmptyStateProps = {
  title: string;
  description: string;
  icon: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
};
const EmptyState = React.forwardRef<EmptyStateElement, EmptyStateProps>(
  ({ title, description, icon, children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="region"
        aria-label={title}
        className={cn(
          'flex h-full flex-col items-center justify-center gap-6 px-8 py-12 sm:px-10 md:px-12',
          dashboardSurfaceClassName,
          className
        )}
        {...props}
      >
        {icon}
        <div className="mx-auto flex max-w-sm flex-col gap-2 text-balance text-center">
          <p className="font-mono text-base font-semibold">{title}</p>
          <p className="font-sans text-sm text-muted-foreground">
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

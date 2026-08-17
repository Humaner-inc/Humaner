import * as React from 'react';

import { dashboardRadiusClassName } from '@/lib/dashboard/surface-styles';
import { cn } from '@/lib/utils';

export type GlassFeatureIconProps = {
  children: React.ReactNode;
  className?: string;
  /** `sm` for list rows; `md` ≈ dock tile; `lg` for empty-page banners. */
  size?: 'sm' | 'md' | 'lg';
};

const SIZE_CLASS: Record<NonNullable<GlassFeatureIconProps['size']>, string> = {
  sm: 'size-9',
  md: 'size-12 sm:size-14',
  lg: 'size-16 sm:size-[4.5rem]'
};

const ICON_CLASS: Record<NonNullable<GlassFeatureIconProps['size']>, string> = {
  sm: '[&_svg]:size-4',
  md: '[&_svg]:size-7 sm:[&_svg]:size-8',
  lg: '[&_svg]:size-7 sm:[&_svg]:size-8'
};

/** Feature empty-state icon tile — Humaner cream glass. */
export function GlassFeatureIcon({
  children,
  className,
  size = 'lg'
}: GlassFeatureIconProps): React.JSX.Element {
  return (
    <div
      className={cn(
        'relative isolate flex items-center justify-center overflow-hidden border',
        SIZE_CLASS[size],
        dashboardRadiusClassName,
        'border-foreground/15 bg-muted/20',
        'shadow-[inset_0_1px_0_rgb(255_255_255_/_0.9),0_22px_50px_-26px_rgb(0_0_0_/_0.14)]',
        'dark:border-white/18 dark:bg-muted/20',
        'dark:shadow-[inset_0_1px_0_rgb(255_255_255_/_0.1),0_22px_50px_-26px_rgb(0_0_0_/_0.85)]',
        className
      )}
    >
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute opacity-70 blur-xl dark:opacity-60',
          size === 'sm' ? '-inset-1' : '-inset-2'
        )}
        style={{
          background:
            'radial-gradient(circle, rgb(225 204 175 / 0.22), transparent 72%)'
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[58%] bg-[radial-gradient(ellipse_90%_90%_at_50%_0%,rgb(255_255_255_/_0.55),transparent)] dark:bg-[radial-gradient(ellipse_90%_90%_at_50%_0%,rgb(255_255_255_/_0.09),transparent)]"
      />
      <span
        className={cn(
          'relative z-10 flex items-center justify-center text-foreground/80 dark:text-[#fcf4ec]',
          ICON_CLASS[size]
        )}
      >
        {children}
      </span>
    </div>
  );
}

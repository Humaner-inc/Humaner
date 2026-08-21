import * as React from 'react';

import { dashboardRadiusClassName } from '@/lib/dashboard/surface-styles';
import { cn } from '@/lib/utils';

export type GlassPanelProps = React.HTMLAttributes<HTMLDivElement> & {
  /**
   * Soft top radial wash + backdrop blur.
   * Set false for tall scroll panels (e.g. Customize) — blur + sticky siblings
   * glitch empty space while scrolling.
   */
  glow?: boolean;
};

/**
 * Landing-style bordered card shell. Light theme matches Integrations dock
 * glass tiles; dark theme matches landing integration mockup panels.
 */
export function GlassPanel({
  className,
  children,
  glow = true,
  ...props
}: GlassPanelProps): React.JSX.Element {
  return (
    <div
      className={cn(
        'relative overflow-hidden border',
        glow
          ? 'isolate border-foreground/15 bg-muted/20 backdrop-blur-xl dark:border-white/[0.08]'
          : 'border-foreground/15 bg-muted/45 dark:border-white/[0.08] dark:bg-[#121212]',
        dashboardRadiusClassName,
        className
      )}
      {...props}
    >
      <div
        aria-hidden
        className="h-px w-full bg-gradient-to-r from-transparent via-foreground/10 to-transparent dark:via-accent/35"
      />
      {glow ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_0%,rgb(224_225_223_/_0.08),transparent_65%)] dark:bg-[radial-gradient(ellipse_90%_60%_at_50%_0%,rgb(255_255_255_/_0.08),transparent_65%)]"
        />
      ) : null}
      <div className="relative">{children}</div>
    </div>
  );
}

export type GlassPanelSectionProps = Omit<
  React.HTMLAttributes<HTMLElement>,
  'title'
> & {
  title?: React.ReactNode;
  description?: string;
  /** Defaults to The Seasons (`subsection-title`). Pass Fellix for in-card titles. */
  titleClassName?: string;
};

export function GlassPanelSection({
  title,
  description,
  titleClassName,
  className,
  children,
  ...props
}: GlassPanelSectionProps): React.JSX.Element {
  return (
    <section
      className={cn('px-4 py-5 sm:px-5', className)}
      {...props}
    >
      {title ? (
        <div className="mb-4">
          <h3
            className={cn(titleClassName ?? 'subsection-title font-semibold')}
          >
            {title}
          </h3>
          {description ? (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function GlassPanelDivider(): React.JSX.Element {
  return (
    <div
      aria-hidden
      className="h-px bg-border/60 dark:bg-white/[0.06]"
    />
  );
}

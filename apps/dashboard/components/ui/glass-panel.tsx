import * as React from 'react';

import { cn } from '@/lib/utils';

export type GlassPanelProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * Landing-style bordered card shell. Light theme matches Integrations dock
 * glass tiles; dark theme matches landing integration mockup panels.
 */
export function GlassPanel({
  className,
  children,
  ...props
}: GlassPanelProps): React.JSX.Element {
  return (
    <div
      className={cn(
        'relative isolate overflow-hidden border backdrop-blur-xl',
        'border-foreground/15 bg-card',
        'dark:border-white/[0.08] dark:bg-black/55',
        className
      )}
      {...props}
    >
      <div
        aria-hidden
        className="h-px w-full bg-gradient-to-r from-transparent via-foreground/10 to-transparent dark:via-accent/35"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_0%,rgb(225_204_175_/_0.08),transparent_65%)] dark:bg-[radial-gradient(ellipse_90%_60%_at_50%_0%,rgb(255_255_255_/_0.08),transparent_65%)]"
      />
      <div className="relative">{children}</div>
    </div>
  );
}

export type GlassPanelSectionProps = React.HTMLAttributes<HTMLElement> & {
  title?: string;
  description?: string;
};

export function GlassPanelSection({
  title,
  description,
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
          <h3 className="subsection-title font-semibold">{title}</h3>
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

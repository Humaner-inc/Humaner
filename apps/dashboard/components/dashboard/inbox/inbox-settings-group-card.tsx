'use client';

import * as React from 'react';
import { MailIcon } from '@humaner/shared/icons';

import { BrandLogo } from '@/components/dashboard/integrations/brand-logo';
import { cn } from '@/lib/utils';

export function InboxSettingsTrailingSlot({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}): React.JSX.Element {
  return (
    <span
      className={cn(
        'flex size-8 shrink-0 items-center justify-center',
        className
      )}
    >
      {children}
    </span>
  );
}

export function InboxSettingsGroupCard({
  title,
  subtitle,
  logoDomain,
  headerIcon,
  headerClassName,
  className,
  titleClassName,
  subtitleClassName,
  children
}: {
  title: string;
  subtitle?: string;
  logoDomain?: string;
  headerIcon?: React.ReactNode;
  headerClassName?: string;
  className?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  children: React.ReactNode;
}): React.JSX.Element {
  const resolvedDomain =
    logoDomain && logoDomain !== 'humaner.io' ? logoDomain : undefined;

  return (
    <section className={cn('overflow-hidden rounded-md border', className)}>
      <div
        className={cn(
          'flex items-start justify-between gap-3 border-b px-4 py-2.5',
          headerClassName ?? 'bg-muted'
        )}
      >
        <div className="min-w-0">
          <p className={cn('font-mono text-sm font-medium', titleClassName)}>
            {title}
          </p>
          {subtitle ? (
            <p
              className={cn('text-xs text-muted-foreground', subtitleClassName)}
            >
              {subtitle}
            </p>
          ) : null}
        </div>
        {headerIcon ?? (
          <InboxSettingsTrailingSlot className="rounded-md bg-background ring-1 ring-border/60">
            <BrandLogo
              domain={resolvedDomain}
              fallbackIcon={MailIcon}
              size={32}
              className="size-5"
            />
          </InboxSettingsTrailingSlot>
        )}
      </div>
      {children}
    </section>
  );
}

export function InboxSettingsGroupRow({
  className,
  children
}: {
  className?: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className={cn('border-b px-4 py-3 last:border-b-0', className)}>
      {children}
    </div>
  );
}

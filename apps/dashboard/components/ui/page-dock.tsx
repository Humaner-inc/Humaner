'use client';

import * as React from 'react';
import Link from 'next/link';

import { cn } from '@/lib/utils';

export type PageDockProps = React.HTMLAttributes<HTMLDivElement>;

export function PageDock({
  className,
  children,
  ...props
}: PageDockProps): React.JSX.Element {
  return (
    <div
      className={cn('shrink-0 px-4 pb-6 pt-5', className)}
      {...props}
    >
      <div className="-mx-1 flex items-end justify-start gap-2 overflow-x-auto px-1 pb-0.5 sm:mx-0 sm:flex-wrap sm:justify-center sm:gap-3 sm:overflow-visible">
        {children}
      </div>
    </div>
  );
}

export function PageDockDivider(): React.JSX.Element {
  return (
    <div
      className="mx-1 hidden h-12 w-px self-center bg-border/80 sm:block"
      aria-hidden
    />
  );
}

export type PageDockItemProps = {
  label: string;
  isActive?: boolean;
  href?: string;
  disabled?: boolean;
  onClick?: () => void;
  /** Glass tiles with white-like icons — matches landing Integrate faster dock. */
  variant?: 'default' | 'glass';
  children: React.ReactNode;
};

export function PageDockItem({
  label,
  isActive = false,
  href,
  disabled = false,
  onClick,
  variant = 'default',
  children
}: PageDockItemProps): React.JSX.Element {
  const isGlass = variant === 'glass';
  const isComingSoon = disabled && isGlass;

  const shell = (
    <>
      <span
        className={cn(
          'relative isolate size-12 sm:size-14',
          isGlass && 'transition-opacity duration-300'
        )}
      >
        {isGlass ? (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-2xl bg-muted dark:bg-[#060707]"
          />
        ) : null}
        <span
          className={cn(
            'absolute inset-0 flex items-center justify-center overflow-hidden rounded-2xl border p-2 transition-[border-color,background-color,box-shadow,opacity] duration-300',
            isGlass
              ? cn(
                  isComingSoon
                    ? isActive
                      ? 'dark:border-white/12 border-border bg-secondary dark:bg-black/30'
                      : 'dark:border-white/8 dark:group-hover:border-white/12 border-border/70 bg-muted group-hover:border-border group-hover:bg-secondary dark:bg-black/25 dark:group-hover:bg-black/30'
                    : isActive
                      ? 'dark:border-white/24 border-foreground/15 bg-muted/20 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.9),0_0_24px_-12px_rgb(225_204_175_/_0.1)] dark:shadow-[inset_0_1px_0_rgb(255_255_255_/_0.2),0_0_32px_-12px_rgb(255_255_255_/_0.08)]'
                      : 'group-hover:border-foreground/12 dark:border-white/16 dark:group-hover:border-white/22 border-border/80 bg-muted group-hover:bg-secondary dark:bg-black/40 dark:group-hover:bg-black/50'
                )
              : cn(
                  'relative',
                  isActive
                    ? 'border-primary/30 bg-muted shadow-[inset_0_1px_0_rgb(255_255_255_/_0.06),0_0_24px_-10px_rgb(225_204_175_/_0.35)]'
                    : 'border-transparent bg-transparent group-hover:border-border/60 group-hover:bg-muted/40'
                )
          )}
        >
          {isActive && (isGlass ? !isComingSoon : true) ? (
            <span
              aria-hidden
              className={cn(
                'pointer-events-none absolute inset-0',
                isGlass
                  ? 'bg-[radial-gradient(ellipse_90%_60%_at_50%_0%,rgb(225_204_175_/_0.1),transparent_65%)] dark:bg-[radial-gradient(ellipse_90%_60%_at_50%_0%,rgb(255_255_255_/_0.12),transparent_65%)]'
                  : 'bg-[radial-gradient(ellipse_90%_60%_at_50%_0%,rgb(225_204_175_/_0.18),transparent_68%)]'
              )}
            />
          ) : null}
          <span className="relative z-10 flex items-center justify-center">
            {children}
          </span>
        </span>
      </span>
      <span
        className={cn(
          'mt-2.5 max-w-[5.5rem] truncate text-center font-sans text-[11px] font-medium transition-colors duration-300 sm:max-w-none sm:text-xs',
          isGlass
            ? isComingSoon
              ? isActive
                ? 'text-muted-foreground dark:text-white/55'
                : 'dark:text-white/32 text-muted-foreground/55 group-hover:text-muted-foreground dark:group-hover:text-white/45'
              : isActive
                ? 'text-foreground dark:text-white'
                : 'dark:text-white/48 dark:group-hover:text-white/72 text-muted-foreground group-hover:text-foreground'
            : isActive
              ? 'text-foreground'
              : 'text-muted-foreground group-hover:text-foreground'
        )}
      >
        {label}
      </span>
    </>
  );

  if (href && !disabled) {
    return (
      <Link
        href={href}
        className={cn(
          'group relative flex shrink-0 flex-col items-center',
          isComingSoon &&
            !isActive &&
            'opacity-50 transition-opacity duration-300 hover:opacity-65'
        )}
        aria-current={isActive ? 'page' : undefined}
      >
        {shell}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={cn(
        'group relative flex shrink-0 flex-col items-center',
        isComingSoon &&
          !isActive &&
          'opacity-50 transition-opacity duration-300 hover:opacity-65'
      )}
      disabled={disabled}
      aria-current={isActive ? 'page' : undefined}
      aria-label={label}
      aria-pressed={onClick ? isActive : undefined}
      onClick={onClick}
    >
      {shell}
    </button>
  );
}

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
      className={cn(
        'shrink-0 border-b bg-background px-4 pb-8 pt-5',
        className
      )}
      {...props}
    >
      <div className="mx-auto flex max-w-4xl flex-wrap items-end justify-center gap-2 sm:gap-3">
        {children}
      </div>
    </div>
  );
}

export function PageDockDivider(): React.JSX.Element {
  return (
    <div
      className="mx-1 hidden h-10 w-px self-center bg-border sm:block"
      aria-hidden
    />
  );
}

export type PageDockItemProps = {
  label: string;
  isActive?: boolean;
  href?: string;
  disabled?: boolean;
  showLabel?: boolean;
  /** When true, the label only appears on hover (not while selected). */
  labelOnHoverOnly?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
};

export function PageDockItem({
  label,
  isActive = false,
  href,
  disabled = false,
  showLabel = true,
  labelOnHoverOnly = false,
  onClick,
  children
}: PageDockItemProps): React.JSX.Element {
  const [hovered, setHovered] = React.useState(false);
  const showTooltip = labelOnHoverOnly ? hovered : isActive || hovered;

  const iconShell = (
    <span
      className={cn(
        'flex size-11 items-center justify-center rounded-2xl border bg-card p-2 shadow-sm transition-all duration-200 sm:size-12',
        isActive
          ? 'scale-105 border-primary/40 bg-primary/5 shadow-md ring-2 ring-primary/20'
          : hovered
            ? 'scale-110 border-foreground/20 shadow-md ring-2 ring-foreground/10'
            : 'border-border scale-100',
        disabled && 'pointer-events-none opacity-50'
      )}
    >
      {children}
    </span>
  );

  const tooltip = (
    <span
      className={cn(
        'pointer-events-none absolute -bottom-8 z-10 whitespace-nowrap rounded-md px-2.5 py-1 text-[11px] font-medium transition-all duration-200',
        showTooltip ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'
      )}
      style={{
        backgroundColor: showTooltip ? '#111' : 'transparent',
        color: showTooltip ? '#fff' : 'transparent'
      }}
    >
      {label}
    </span>
  );

  const shell = (
    <>
      {iconShell}
      {showLabel ? tooltip : null}
    </>
  );

  if (href && !disabled) {
    return (
      <Link
        href={href}
        className="group relative flex flex-col items-center"
        aria-current={isActive ? 'page' : undefined}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {shell}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className="group relative flex flex-col items-center"
      disabled={disabled}
      aria-current={isActive ? 'page' : undefined}
      aria-label={label}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {shell}
    </button>
  );
}

import * as React from 'react';

import { cn } from '@/lib/utils';

/** Full-height scroll region for main nav pages (sidebar shows the section name). */
export type SectionContentProps = React.HTMLAttributes<HTMLDivElement> & {
  width?: 'md' | 'lg' | 'xl' | 'full';
  /** Inbox / desk splits need a bounded pane — not an outer scrollport. */
  overflow?: 'auto' | 'hidden';
};

const WIDTH_CLASS = {
  md: 'max-w-4xl',
  lg: 'max-w-6xl',
  xl: 'max-w-[80rem]',
  full: 'max-w-none'
} as const;

export function SectionContent({
  className,
  width = 'xl',
  overflow = 'auto',
  children,
  ...props
}: SectionContentProps): React.JSX.Element {
  return (
    <div
      className={cn(
        'min-h-0 flex-1',
        overflow === 'hidden' ? 'overflow-hidden' : 'overflow-auto'
      )}
    >
      <div
        className={cn(
          'mx-auto w-full p-6 md:p-8',
          overflow === 'hidden' && 'flex h-full min-h-0 flex-col',
          WIDTH_CLASS[width],
          className
        )}
        {...props}
      >
        {children}
      </div>
    </div>
  );
}

/** Single-section pages — sidebar shows the name, no top header bar. */
export function SectionPage({
  children,
  width = 'xl',
  className,
  ...props
}: Omit<SectionContentProps, 'children'> & {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <SectionContent
        width={width}
        className={className}
        {...props}
      >
        {children}
      </SectionContent>
    </div>
  );
}

export type DockSectionProps = React.PropsWithChildren<{
  dock: React.ReactNode;
  contentClassName?: string;
  width?: SectionContentProps['width'];
}>;

export function DockSection({
  dock,
  children,
  contentClassName,
  width = 'xl'
}: DockSectionProps): React.JSX.Element {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      {dock}
      <SectionContent
        width={width}
        className={contentClassName}
      >
        {children}
      </SectionContent>
    </div>
  );
}

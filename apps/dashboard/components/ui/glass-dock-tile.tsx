import * as React from 'react';

import { cn } from '@/lib/utils';

export type GlassDockTileProps = {
  children: React.ReactNode;
  className?: string;
  active?: boolean;
  size?: 'sm' | 'md' | 'lg';
  /** `soft` = light-theme neutral grey chrome. Default dark glass. */
  tone?: 'dark' | 'soft';
};

const SIZE_CLASS = {
  sm: 'size-9 rounded-2xl',
  md: 'size-12 rounded-2xl sm:size-14',
  lg: 'size-14 rounded-2xl sm:size-16'
} as const;

/** Glass tile shell — matches Integrations dock icon styling. */
export function GlassDockTile({
  children,
  className,
  active = true,
  size = 'sm',
  tone = 'dark'
}: GlassDockTileProps): React.JSX.Element {
  const soft = tone === 'soft';

  return (
    <span
      className={cn('relative isolate shrink-0', SIZE_CLASS[size], className)}
    >
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-0',
          soft ? 'bg-[#eaeaea]' : 'bg-[#0A0D0D]',
          SIZE_CLASS[size]
        )}
      />
      <span
        className={cn(
          'absolute inset-0 flex items-center justify-center overflow-hidden border p-0 transition-[border-color,background-color,box-shadow] duration-300',
          SIZE_CLASS[size],
          soft
            ? active
              ? 'border-black/[0.1] bg-[#f2f2f2]/95 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.9),0_10px_24px_-16px_rgb(0_0_0_/_0.1)]'
              : 'border-black/[0.08] bg-[#f2f2f2]/80'
            : active
              ? 'border-white/24 bg-[#0A0D0D]/55 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.2),0_0_32px_-12px_rgb(255_255_255_/_0.08)]'
              : 'border-white/16 bg-[#0A0D0D]/40'
        )}
      >
        {active ? (
          <span
            aria-hidden
            className={cn(
              'pointer-events-none absolute inset-0',
              soft
                ? 'bg-[radial-gradient(ellipse_90%_60%_at_50%_0%,rgb(255_255_255_/_0.7),transparent_65%)]'
                : 'bg-[radial-gradient(ellipse_90%_60%_at_50%_0%,rgb(255_255_255_/_0.12),transparent_65%)]'
            )}
          />
        ) : null}
        <span className="relative z-10 flex size-full items-center justify-center overflow-hidden">
          {children}
        </span>
      </span>
    </span>
  );
}

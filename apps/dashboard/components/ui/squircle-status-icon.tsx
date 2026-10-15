import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * Status icons drawn on the exact squircle outline used by the Humaner
 * loading spinner (ldrs Squircle, 37-unit viewBox, 5-unit stroke).
 */
export type SquircleStatusKind =
  | 'open'
  | 'progress'
  | 'checking'
  | 'done'
  | 'blocked'
  | 'cancelled'
  | 'idle'
  | 'dashed';

const SQUIRCLE_PATH =
  'M0 18.5C0 3.55 3.55 0 18.5 0S37 3.55 37 18.5 33.45 37 18.5 37 0 33.45 0 18.5Z';

/** Clockwise pie wedges starting at 12 o'clock (center 18.5, 18.5). */
const WEDGES: Partial<Record<SquircleStatusKind, string>> = {
  open: 'M18.5 18.5L18.5 -5L42 -5L42 18.5Z',
  progress: 'M18.5 18.5L18.5 -5L42 -5L42 42L18.5 42Z',
  checking: 'M18.5 18.5L18.5 -5L42 -5L42 42L-5 42L-5 18.5Z'
};

const KIND_TONE: Record<SquircleStatusKind, string> = {
  open: 'text-[#f5b50a]',
  progress: 'text-[#f57c00]',
  checking: 'text-[#2eb52e]',
  done: 'text-info',
  blocked: 'text-[#f4574d]',
  cancelled: 'text-muted-foreground',
  idle: 'text-muted-foreground',
  dashed: 'text-muted-foreground/70'
};

export function SquircleStatusIcon({
  kind,
  className
}: {
  kind: SquircleStatusKind;
  className?: string;
}): React.JSX.Element {
  const id = React.useId();
  const clipId = `${id}-clip`;
  const wedge = WEDGES[kind];

  return (
    <span
      className={cn(
        'inline-flex size-3.5 shrink-0 items-center justify-center',
        KIND_TONE[kind],
        className
      )}
      aria-hidden
    >
      <svg
        viewBox="-3 -3 43 43"
        className="size-full"
        fill="none"
        stroke="currentColor"
        strokeWidth={5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          d={SQUIRCLE_PATH}
          strokeDasharray={
            kind === 'dashed' || kind === 'idle' ? '7 6' : undefined
          }
        />
        {wedge ? (
          <>
            <defs>
              <clipPath id={clipId}>
                <path
                  d={SQUIRCLE_PATH}
                  transform="translate(18.5 18.5) scale(0.56) translate(-18.5 -18.5)"
                />
              </clipPath>
            </defs>
            <path
              d={wedge}
              fill="currentColor"
              stroke="none"
              clipPath={`url(#${clipId})`}
            />
          </>
        ) : null}
        {kind === 'done' ? (
          <path
            d="M10.5 19.5L16 25L27 12.5"
            strokeWidth={4.5}
          />
        ) : null}
        {kind === 'blocked' ? (
          <path
            d="M8 29L29 8"
            strokeWidth={4.5}
          />
        ) : null}
        {kind === 'cancelled' ? (
          <path
            d="M12.5 12.5L24.5 24.5M24.5 12.5L12.5 24.5"
            strokeWidth={4.5}
          />
        ) : null}
      </svg>
    </span>
  );
}

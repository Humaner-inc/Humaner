'use client';

import * as React from 'react';
import { BrandSwap } from '@humaner/shared/brand-swap';
import { BrandWordmark } from '@humaner/shared/brand-wordmark';
import { CompanionMark } from '@humaner/shared/companion-icon';

import { AppInfo } from '@/constants/app-info';
import { cn } from '@/lib/utils';

export type HumanerBrandTitleProps = {
  className?: string;
  wordmarkClassName?: string;
  markClassName?: string;
  /** Kept for call-site compatibility — Companion mark is the fixed brand SVG. */
  markTone?: 'light' | 'dark';
  name?: string;
};

export function HumanerBrandTitle({
  className,
  wordmarkClassName,
  markClassName,
  markTone: _markTone,
  name = AppInfo.APP_NAME
}: HumanerBrandTitleProps): React.JSX.Element {
  const [hovered, setHovered] = React.useState(false);

  return (
    <span
      className={cn('inline-flex', className)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
    >
      <BrandSwap
        active={hovered}
        rest={
          <BrandWordmark
            interactive={false}
            className={wordmarkClassName}
          >
            {name}
          </BrandWordmark>
        }
        next={
          <CompanionMark
            size={30}
            className={cn(
              'pointer-events-none h-[1.9em] w-[1.9em] text-current',
              markClassName
            )}
          />
        }
      />
    </span>
  );
}

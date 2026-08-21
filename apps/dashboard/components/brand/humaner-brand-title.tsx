'use client';

import * as React from 'react';
import { BrandMark } from '@humaner/shared/brand-mark';
import { BrandSwap } from '@humaner/shared/brand-swap';
import { BrandWordmark } from '@humaner/shared/brand-wordmark';

import { AppInfo } from '@/constants/app-info';
import { cn } from '@/lib/utils';

export type HumanerBrandTitleProps = {
  className?: string;
  wordmarkClassName?: string;
  markClassName?: string;
  /** Force the mark for a dark or light surface, ignoring html theme. */
  markTone?: 'light' | 'dark';
  name?: string;
};

export function HumanerBrandTitle({
  className,
  wordmarkClassName,
  markClassName,
  markTone,
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
          markTone === 'dark' ? (
            <BrandMark
              className={cn(
                'pointer-events-none h-[1.9em] w-[1.9em]',
                markClassName
              )}
            />
          ) : markTone === 'light' ? (
            <BrandMark
              invert
              className={cn(
                'pointer-events-none h-[1.9em] w-[1.9em]',
                markClassName
              )}
            />
          ) : (
            <>
              <BrandMark
                invert
                className={cn(
                  'pointer-events-none h-[1.9em] w-[1.9em] dark:hidden',
                  markClassName
                )}
              />
              <BrandMark
                className={cn(
                  'pointer-events-none hidden h-[1.9em] w-[1.9em] dark:block',
                  markClassName
                )}
              />
            </>
          )
        }
      />
    </span>
  );
}

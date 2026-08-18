'use client';

import * as React from 'react';
import Image from 'next/image';
import { BrandSwap } from '@humaner/shared/brand-swap';
import { BrandWordmark } from '@humaner/shared/brand-wordmark';

import { HumanerLogoImage } from '@/components/brand/humaner-logo-image';
import { AppInfo } from '@/constants/app-info';
import { getLogo } from '@/lib/theme/brand';
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
          markTone ? (
            <Image
              src={getLogo(markTone)}
              alt=""
              width={40}
              height={40}
              unoptimized
              className={cn(
                'pointer-events-none h-[1.9em] w-[1.9em] object-contain',
                markClassName
              )}
            />
          ) : (
            <HumanerLogoImage
              width={40}
              height={40}
              className={cn(
                'pointer-events-none h-[1.9em] w-[1.9em] object-contain',
                markClassName
              )}
            />
          )
        }
      />
    </span>
  );
}

'use client';

import * as React from 'react';
import { useState } from 'react';
import Image from 'next/image';
import { BrandWordmark } from '@humaner/shared/brand-wordmark';

import { AppInfo } from '@/constants/app-info';
import { getLogo } from '@/lib/theme/brand';
import { cn } from '@/lib/utils';

export type LogoProps = React.HTMLAttributes<HTMLDivElement> & {
  hideSymbol?: boolean;
  hideWordmark?: boolean;
};

export function Logo({
  hideSymbol,
  hideWordmark,
  className,
  ...other
}: LogoProps): React.JSX.Element {
  const [hovered, setHovered] = useState(false);
  const name = AppInfo.APP_NAME;

  return (
    <div
      className={cn('flex items-center gap-2.5', className)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      {...other}
    >
      {!hideSymbol && (
        <Image
          src={getLogo('light')}
          alt=""
          width={600}
          height={600}
          unoptimized
          className="h-8 w-auto shrink-0 dark:brightness-0 dark:invert"
        />
      )}
      {!hideWordmark && (
        <BrandWordmark
          active={hovered}
          hoverText={name}
          className="font-display text-lg font-semibold tracking-tight text-foreground"
        >
          {name}
        </BrandWordmark>
      )}
    </div>
  );
}

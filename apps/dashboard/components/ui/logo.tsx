'use client';

import { BrandWordmark } from '@humaner/shared/brand-wordmark';
import Image from 'next/image';
import * as React from 'react';
import { useState } from 'react';
import { AppInfo } from '@/constants/app-info';
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

  return (
    <div
      className={cn('flex items-center gap-2.5', className)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      {...other}
    >
      {!hideSymbol && (
        <Image
          src="/humaner.svg"
          alt=""
          width={600}
          height={600}
          unoptimized
          className="h-8 w-auto shrink-0"
        />
      )}
      {!hideWordmark && (
        <BrandWordmark
          active={hovered}
          className="font-display text-lg font-semibold tracking-tight text-foreground"
        >
          {AppInfo.APP_NAME}
        </BrandWordmark>
      )}
    </div>
  );
}

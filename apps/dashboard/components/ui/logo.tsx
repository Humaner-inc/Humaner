'use client';

import * as React from 'react';
import { useState } from 'react';
import { BrandWordmark } from '@humaner/shared/brand-wordmark';

import { HumanerLogoImage } from '@/components/brand/humaner-logo-image';
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
  const name = AppInfo.APP_NAME;

  return (
    <div
      className={cn('flex items-center gap-2.5', className)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      {...other}
    >
      {!hideSymbol && (
        <HumanerLogoImage
          width={600}
          height={600}
          className="h-8 w-auto shrink-0"
        />
      )}
      {!hideWordmark && (
        <BrandWordmark
          active={hovered}
          hoverText={name}
          className="font-display text-lg font-normal tracking-tight text-foreground"
        >
          {name}
        </BrandWordmark>
      )}
    </div>
  );
}

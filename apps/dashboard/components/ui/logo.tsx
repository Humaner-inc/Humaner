'use client';

import * as React from 'react';
import { useState } from 'react';
import Image from 'next/image';
import { BrandWordmark } from '@humaner/shared/brand-wordmark';

import { AppInfo } from '@/constants/app-info';
import { isOssDeployment } from '@/lib/deployment-mode';
import { getLogo } from '@/lib/theme/brand';
import { cn } from '@/lib/utils';

export type LogoProps = React.HTMLAttributes<HTMLDivElement> & {
  hideSymbol?: boolean;
  hideWordmark?: boolean;
};

function AcmeMark({ className }: { className?: string }): React.JSX.Element {
  return (
    <div
      className={cn(
        'flex size-7 items-center justify-center rounded-md border border-zinc-900 text-zinc-900',
        className
      )}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <g fill="currentColor">
          <path d="M7.81815 8.36373L12 0L24 24H15.2809L7.81815 8.36373Z" />
          <path d="M4.32142 15.3572L8.44635 24H0L4.32142 15.3572Z" />
        </g>
      </svg>
    </div>
  );
}

export function Logo({
  hideSymbol,
  hideWordmark,
  className,
  ...other
}: LogoProps): React.JSX.Element {
  const [hovered, setHovered] = useState(false);
  const oss = isOssDeployment();
  const name = AppInfo.APP_NAME;

  return (
    <div
      className={cn('flex items-center gap-2.5', className)}
      onMouseEnter={oss ? undefined : () => setHovered(true)}
      onMouseLeave={oss ? undefined : () => setHovered(false)}
      {...other}
    >
      {!hideSymbol &&
        (oss ? (
          <div className="flex size-9 items-center justify-center p-1">
            <AcmeMark />
          </div>
        ) : (
          <Image
            src={getLogo('light')}
            alt=""
            width={600}
            height={600}
            unoptimized
            className="h-8 w-auto shrink-0"
          />
        ))}
      {!hideWordmark &&
        (oss ? (
          <span className="font-sans text-lg font-semibold tracking-tight text-zinc-950">
            {name}
          </span>
        ) : (
          <BrandWordmark
            active={hovered}
            hoverText={name}
            className="font-display text-lg font-semibold tracking-tight text-foreground"
          >
            {name}
          </BrandWordmark>
        ))}
    </div>
  );
}

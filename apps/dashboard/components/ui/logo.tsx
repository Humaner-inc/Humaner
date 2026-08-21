'use client';

import * as React from 'react';

import { HumanerBrandTitle } from '@/components/brand/humaner-brand-title';
import { HumanerLogoImage } from '@/components/brand/humaner-logo-image';
import { AppInfo } from '@/constants/app-info';
import { cn } from '@/lib/utils';

export type LogoProps = React.HTMLAttributes<HTMLDivElement> & {
  hideSymbol?: boolean;
  hideWordmark?: boolean;
  /** Use the white-ink mark (dark surfaces). */
  onDark?: boolean;
};

export function Logo({
  hideSymbol: _hideSymbol,
  hideWordmark,
  onDark,
  className,
  ...other
}: LogoProps): React.JSX.Element {
  const name = AppInfo.APP_NAME;

  if (hideWordmark) {
    return (
      <div
        className={cn('flex items-center gap-2.5', className)}
        {...other}
      >
        <HumanerLogoImage
          width={600}
          height={600}
          className="h-8 w-auto shrink-0"
        />
      </div>
    );
  }

  return (
    <div
      className={cn('flex items-center justify-center', className)}
      {...other}
    >
      <HumanerBrandTitle
        name={name}
        markTone={onDark ? 'dark' : undefined}
        wordmarkClassName="font-display text-lg font-normal tracking-tight text-[#0A0D0D] dark:text-[#e0e1df]"
      />
    </div>
  );
}

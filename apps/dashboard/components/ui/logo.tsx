import Image from 'next/image';
import * as React from 'react';

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
  return (
    <div
      className={cn('flex items-center gap-2.5', className)}
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
        <span className="font-display text-lg font-semibold tracking-tight text-foreground">
          {AppInfo.APP_NAME}
        </span>
      )}
    </div>
  );
}

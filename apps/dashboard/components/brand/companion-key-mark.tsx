import * as React from 'react';
import { CompanionMark } from '@humaner/shared/companion-icon';
import { KeyRoundIcon } from '@humaner/shared/icons';

import { dashboardRadiusClassName } from '@/lib/dashboard/surface-styles';
import { cn } from '@/lib/utils';

/** Companion runner + key badge — shown once an API key is created. */
export function CompanionKeyMark({
  className,
  size = 'lg'
}: {
  className?: string;
  size?: 'md' | 'lg';
}): React.JSX.Element {
  const tileClass = size === 'lg' ? 'size-16 sm:size-[4.5rem]' : 'size-14';
  const runnerClass = size === 'lg' ? 'size-9 sm:size-10' : 'size-8';
  const badgeClass = size === 'lg' ? 'size-7' : 'size-6';
  const keyClass = size === 'lg' ? 'size-3' : 'size-2.5';

  return (
    <div className={cn('relative inline-flex', className)}>
      <div
        className={cn(
          'relative isolate flex items-center justify-center overflow-hidden border border-foreground/15 bg-muted/20 text-[#f2f2f2] shadow-[inset_0_1px_0_rgb(255_255_255_/_0.9),0_22px_50px_-26px_rgb(0_0_0_/_0.14)] dark:border-white/18 dark:bg-[#0A0D0D] dark:shadow-[inset_0_1px_0_rgb(255_255_255_/_0.1),0_22px_50px_-26px_rgb(0_0_0_/_0.85)]',
          dashboardRadiusClassName,
          tileClass
        )}
      >
        <CompanionMark className={runnerClass} />
      </div>
      <div
        className={cn(
          'absolute -bottom-1 -right-2 z-10 flex items-center justify-center rounded-full border border-white/18 bg-[#18181b] text-primary shadow-sm ring-2 ring-background',
          badgeClass
        )}
      >
        <KeyRoundIcon className={keyClass} />
      </div>
    </div>
  );
}

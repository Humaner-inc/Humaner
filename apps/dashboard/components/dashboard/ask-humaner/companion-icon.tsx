'use client';

import type * as React from 'react';
import { BotIcon } from '@humaner/shared/icons';

import { cn } from '@/lib/utils';

export type CompanionFigureState = 'idle' | 'enter' | 'exit';

export type CompanionIconProps = {
  active?: boolean;
  size?: number;
  className?: string;
  state?: CompanionFigureState;
  onExitComplete?: () => void;
};

export function CompanionIcon({
  size = 20,
  className
}: CompanionIconProps): React.JSX.Element {
  return (
    <BotIcon
      className={cn('size-5 shrink-0', className)}
      style={{ width: size, height: size }}
    />
  );
}

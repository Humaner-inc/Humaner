'use client';

import * as React from 'react';

import type { TooltipContentProps } from '@/components/ui/tooltip';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export type HintLabelProps = {
  children: React.ReactNode;
  hint?: string;
  as?: 'span' | 'h1' | 'h2' | 'h3' | 'label' | 'p';
  className?: string;
  tooltipClassName?: string;
  side?: TooltipContentProps['side'];
  align?: TooltipContentProps['align'];
};

export function HintLabel({
  children,
  hint,
  as: Tag = 'span',
  className,
  tooltipClassName,
  side = 'right',
  align = 'start'
}: HintLabelProps): React.JSX.Element {
  if (!hint?.trim()) {
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <Tag
          className={cn(
            'inline cursor-default underline decoration-muted-foreground/40 decoration-dotted underline-offset-[3px]',
            className
          )}
        >
          {children}
        </Tag>
      </TooltipTrigger>
      <TooltipContent
        side={side}
        align={align}
        sideOffset={8}
        collisionPadding={12}
        className={cn('max-w-56 text-xs leading-relaxed', tooltipClassName)}
      >
        {hint}
      </TooltipContent>
    </Tooltip>
  );
}

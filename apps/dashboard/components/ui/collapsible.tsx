'use client';

import * as React from 'react';
import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';

import { cn } from '@/lib/utils';

export type CollapsibleElement = React.ElementRef<
  typeof CollapsiblePrimitive.Root
>;
export type CollapsibleProps = React.ComponentProps<
  typeof CollapsiblePrimitive.Root
>;
const Collapsible = CollapsiblePrimitive.Root;

export type CollapsibleTriggerElement = React.ElementRef<
  typeof CollapsiblePrimitive.CollapsibleTrigger
>;
export type CollapsibleTriggerProps = React.ComponentProps<
  typeof CollapsiblePrimitive.CollapsibleTrigger
>;
const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger;

export type CollapsibleContentElement = React.ElementRef<
  typeof CollapsiblePrimitive.CollapsibleContent
>;
export type CollapsibleContentProps = React.ComponentPropsWithoutRef<
  typeof CollapsiblePrimitive.CollapsibleContent
>;
const CollapsibleContent = React.forwardRef<
  CollapsibleContentElement,
  CollapsibleContentProps
>(({ className, ...props }, ref) => (
  <CollapsiblePrimitive.CollapsibleContent
    ref={ref}
    className={cn(
      'overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down',
      className
    )}
    {...props}
  />
));

export { Collapsible, CollapsibleContent, CollapsibleTrigger };

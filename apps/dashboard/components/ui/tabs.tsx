'use client';

import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';

import { cn } from '@/lib/utils';

export type TabsElement = React.ElementRef<typeof TabsPrimitive.Root>;
export type TabsProps = React.ComponentProps<typeof TabsPrimitive.Root>;
const Tabs = TabsPrimitive.Root;

export type TabsListElement = React.ElementRef<typeof TabsPrimitive.List>;
export type TabsListProps = React.ComponentPropsWithoutRef<
  typeof TabsPrimitive.List
>;
const TabsList = React.forwardRef<TabsListElement, TabsListProps>(
  ({ className, ...props }, ref) => (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        'inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground',
        className
      )}
      {...props}
    />
  )
);
TabsList.displayName = TabsPrimitive.List.displayName;

export type TabsTriggerElement = React.ElementRef<typeof TabsPrimitive.Trigger>;
export type TabsTriggerProps = React.ComponentPropsWithoutRef<
  typeof TabsPrimitive.Trigger
>;
const TabsTrigger = React.forwardRef<TabsTriggerElement, TabsTriggerProps>(
  ({ className, ...props }, ref) => (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow',
        className
      )}
      {...props}
    />
  )
);
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

export type TabsContentElement = React.ElementRef<typeof TabsPrimitive.Content>;
export type TabsContentProps = React.ComponentPropsWithoutRef<
  typeof TabsPrimitive.Content
>;
const TabsContent = React.forwardRef<TabsContentElement, TabsContentProps>(
  ({ className, ...props }, ref) => (
    <TabsPrimitive.Content
      ref={ref}
      className={cn(
        'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className
      )}
      {...props}
    />
  )
);
TabsContent.displayName = TabsPrimitive.Content.displayName;

export type UnderlinedTabsElement = React.ElementRef<typeof TabsPrimitive.Root>;
export type UnderlinedTabsProps = React.ComponentProps<
  typeof TabsPrimitive.Root
>;
const UnderlinedTabs = TabsPrimitive.Root;
UnderlinedTabs.displayName = 'UnderlinedTabs';

export type UnderlinedTabsListElement = React.ElementRef<
  typeof TabsPrimitive.List
>;
export type UnderlinedTabsListProps = React.ComponentPropsWithoutRef<
  typeof TabsPrimitive.List
>;
const UnderlinedTabsList = React.forwardRef<
  UnderlinedTabsListElement,
  UnderlinedTabsListProps
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'inline-flex h-12 items-center justify-start text-muted-foreground',
      className
    )}
    {...props}
  />
));
UnderlinedTabsList.displayName = 'UnderlinedTabsList';

export type UnderlinedTabsTriggerElement = React.ElementRef<
  typeof TabsPrimitive.Trigger
>;
export type UnderlinedTabsTriggerProps = React.ComponentPropsWithoutRef<
  typeof TabsPrimitive.Trigger
>;
const UnderlinedTabsTrigger = React.forwardRef<
  UnderlinedTabsTriggerElement,
  UnderlinedTabsTriggerProps
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'group relative mx-4 inline-flex h-12 items-center justify-center whitespace-nowrap rounded-none border-b border-b-transparent bg-transparent py-1 pb-3 pt-2 text-sm text-muted-foreground shadow-none ring-offset-background transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:border-b-primary data-[state=active]:font-medium data-[state=active]:text-foreground data-[state=active]:shadow-none',
      className
    )}
    {...props}
  />
));
UnderlinedTabsTrigger.displayName = 'UnderlinedTabsTrigger';

export type UnderlinedTabsContentElement = React.ElementRef<
  typeof TabsPrimitive.Content
>;
export type UnderlinedTabsContentProps = React.ComponentPropsWithoutRef<
  typeof TabsPrimitive.Content
>;
const UnderlinedTabsContent = React.forwardRef<
  UnderlinedTabsContentElement,
  UnderlinedTabsContentProps
>((props, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    {...props}
  />
));
UnderlinedTabsContent.displayName = 'UnderlinedTabsContent';

export {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  UnderlinedTabs,
  UnderlinedTabsContent,
  UnderlinedTabsList,
  UnderlinedTabsTrigger
};

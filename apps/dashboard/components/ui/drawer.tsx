'use client';

import * as React from 'react';
import { Drawer as DrawerPrimitive } from 'vaul';

import { cn } from '@/lib/utils';

export type DrawerProps = React.ComponentProps<typeof DrawerPrimitive.Root>;
const Drawer = ({ shouldScaleBackground = true, ...props }: DrawerProps) => (
  <DrawerPrimitive.Root
    shouldScaleBackground={shouldScaleBackground}
    {...props}
  />
);
Drawer.displayName = 'Drawer';

export type DrawerTriggerElement = React.ElementRef<
  typeof DrawerPrimitive.Trigger
>;
export type DrawerTriggerProps = React.ComponentProps<
  typeof DrawerPrimitive.Trigger
>;
const DrawerTrigger = DrawerPrimitive.Trigger;

export type DrawerPortalProps = React.ComponentProps<
  typeof DrawerPrimitive.Portal
>;
const DrawerPortal = DrawerPrimitive.Portal;

export type DrawerCloseElement = React.ElementRef<typeof DrawerPrimitive.Close>;
export type DrawerCloseProps = React.ComponentProps<
  typeof DrawerPrimitive.Close
>;
const DrawerClose = DrawerPrimitive.Close;

export type DrawerOverlayElement = React.ElementRef<
  typeof DrawerPrimitive.Overlay
>;
export type DrawerOverlayProps = React.ComponentPropsWithoutRef<
  typeof DrawerPrimitive.Overlay
>;
const DrawerOverlay = React.forwardRef<
  DrawerOverlayElement,
  DrawerOverlayProps
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Overlay
    ref={ref}
    className={cn('fixed inset-0 z-50 bg-black/80', className)}
    {...props}
  />
));
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName;

export type DrawerContentElement = React.ElementRef<
  typeof DrawerPrimitive.Content
>;
export type DrawerContentProps = React.ComponentPropsWithoutRef<
  typeof DrawerPrimitive.Content
>;
const DrawerContent = React.forwardRef<
  DrawerContentElement,
  DrawerContentProps
>(({ className, children, ...props }, ref) => (
  <DrawerPortal>
    <DrawerOverlay />
    <DrawerPrimitive.Content
      ref={ref}
      className={cn(
        'fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-[10px] border bg-background',
        className
      )}
      {...props}
    >
      <div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted" />
      {children}
    </DrawerPrimitive.Content>
  </DrawerPortal>
));
DrawerContent.displayName = 'DrawerContent';

export type DrawerHeaderElement = HTMLDivElement;
export type DrawerHeaderProps = React.HTMLAttributes<HTMLDivElement>;
const DrawerHeader = ({ className, ...props }: DrawerHeaderProps) => (
  <div
    className={cn('grid gap-1.5 p-4 text-center sm:text-left', className)}
    {...props}
  />
);
DrawerHeader.displayName = 'DrawerHeader';

export type DrawerFooterElement = HTMLDivElement;
export type DrawerFooterProps = React.HTMLAttributes<HTMLDivElement>;
const DrawerFooter = ({ className, ...props }: DrawerFooterProps) => (
  <div
    className={cn('mt-auto flex flex-col gap-2 p-4', className)}
    {...props}
  />
);
DrawerFooter.displayName = 'DrawerFooter';

export type DrawerTitleElement = React.ElementRef<typeof DrawerPrimitive.Title>;
export type DrawerTitleProps = React.ComponentPropsWithoutRef<
  typeof DrawerPrimitive.Title
>;
const DrawerTitle = React.forwardRef<DrawerTitleElement, DrawerTitleProps>(
  ({ className, ...props }, ref) => (
    <DrawerPrimitive.Title
      ref={ref}
      className={cn(
        'text-lg font-semibold leading-none tracking-tight',
        className
      )}
      {...props}
    />
  )
);
DrawerTitle.displayName = DrawerPrimitive.Title.displayName;

export type DrawerDescriptionElement = React.ElementRef<
  typeof DrawerPrimitive.Description
>;
export type DrawerDescriptionProps = React.ComponentPropsWithoutRef<
  typeof DrawerPrimitive.Description
>;
const DrawerDescription = React.forwardRef<
  DrawerDescriptionElement,
  DrawerDescriptionProps
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Description
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
DrawerDescription.displayName = DrawerPrimitive.Description.displayName;

export {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerPortal,
  DrawerTitle,
  DrawerTrigger
};

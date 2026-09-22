'use client';

import * as React from 'react';
import { Cross2Icon } from '@radix-ui/react-icons';

import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  type DialogContentProps
} from '@/components/ui/dialog';
import { dashboardQuickCreateClassName } from '@/lib/dashboard/surface-styles';
import { cn } from '@/lib/utils';

export const QUICK_CREATE_TITLE_CLASS =
  'w-full bg-transparent text-[17px] font-normal leading-snug text-foreground outline-none placeholder:text-muted-foreground/55';

export const QUICK_CREATE_BODY_CLASS =
  'min-h-16 w-full resize-none bg-transparent text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/50';

export const QUICK_CREATE_META_CLASS =
  'w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/55';

/** Same `--muted` fill as inset headers and header icon hover. */
export const QUICK_CREATE_FIELD_CLASS =
  'h-10 w-full rounded-xl border border-border/60 bg-muted px-3 text-sm text-foreground shadow-none outline-none placeholder:text-muted-foreground/55 focus-visible:ring-1 focus-visible:ring-ring';

/** Outline property chips — Linear-style: icon + label, same surface as the card. */
export const QUICK_CREATE_CHIP_CLASS =
  'inline-flex h-7 items-center gap-1 rounded-md border border-foreground/15 bg-transparent px-1.5 font-sans text-[13px] font-normal leading-none tracking-normal text-muted-foreground shadow-none transition-colors hover:bg-muted/40 hover:text-foreground';

export const QUICK_CREATE_CHIP_ACTIVE_CLASS =
  'border-foreground/20 bg-muted/40 text-foreground';

export function QuickCreateDialogContent({
  title,
  description,
  className,
  children,
  preventDismiss = false,
  hideCardClose = false,
  ...props
}: DialogContentProps & {
  title: string;
  description: string;
  /** Hide the overlapping card X when a footer Cancel is used instead. */
  hideCardClose?: boolean;
}): React.JSX.Element {
  return (
    <DialogContent
      hideClose
      preventDismiss={preventDismiss}
      className={cn(
        'flex w-full max-w-lg flex-col items-center gap-3 border-0 bg-transparent p-0 shadow-none sm:max-w-xl',
        className
      )}
      {...props}
    >
      <DialogTitle className="onboarding-interval-shine text-center font-sans text-sm font-medium">
        {title}
      </DialogTitle>
      <DialogDescription className="sr-only">{description}</DialogDescription>
      <div
        className={cn(
          dashboardQuickCreateClassName,
          'relative flex max-h-[min(40rem,90vh)] w-full flex-col gap-0 overflow-hidden p-0'
        )}
      >
        {children}
        {preventDismiss || hideCardClose ? null : (
          <DialogClose
            type="button"
            className="absolute right-3 top-3 rounded-lg p-1.5 text-muted-foreground opacity-70 ring-offset-background transition-colors hover:bg-muted/60 hover:text-foreground hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
          >
            <Cross2Icon className="size-4 shrink-0" />
            <span className="sr-only">Close</span>
          </DialogClose>
        )}
      </div>
    </DialogContent>
  );
}

export function QuickCreateFooter({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}): React.JSX.Element {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-2 bg-transparent px-4 pb-3.5 pt-1',
        className
      )}
    >
      {children}
    </div>
  );
}

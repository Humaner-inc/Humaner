'use client';

import * as React from 'react';
import { Trash2Icon } from '@humaner/shared/icons';

import { Button, type ButtonProps } from '@/components/ui/button';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

/** Matches notifications drawer clear-all trash button. */
export const deleteIconButtonClassName =
  'size-8 shrink-0 text-muted-foreground hover:bg-muted/60 hover:text-destructive';

export const deleteActionGroupClassName = 'group/delete';

export const deleteActionIconClassName =
  'size-4 shrink-0 text-current opacity-70 transition-opacity duration-200 group-hover/delete:opacity-100 group-focus-visible/delete:opacity-100';

export const deleteActionMenuItemClassName = cn(
  deleteActionGroupClassName,
  'mx-1 my-0.5 font-fellix text-destructive focus:bg-destructive/10 focus:text-destructive'
);

export type DeleteActionButtonProps = ButtonProps;

export function DeleteActionButton({
  className,
  children,
  variant = 'ghost',
  size = 'sm',
  ...props
}: DeleteActionButtonProps): React.JSX.Element {
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn(
        deleteActionGroupClassName,
        'gap-1.5 text-muted-foreground hover:bg-muted/60 hover:text-destructive',
        className
      )}
      {...props}
    >
      <Trash2Icon
        className="size-4 shrink-0"
        aria-hidden
      />
      <span>{children}</span>
    </Button>
  );
}

export type DeleteIconActionButtonProps = ButtonProps & {
  srLabel: string;
};

export function DeleteIconActionButton({
  className,
  srLabel,
  size = 'icon',
  variant = 'ghost',
  ...props
}: DeleteIconActionButtonProps): React.JSX.Element {
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn(deleteIconButtonClassName, className)}
      aria-label={srLabel}
      {...props}
    >
      <Trash2Icon
        className="size-4"
        aria-hidden
      />
      <span className="sr-only">{srLabel}</span>
    </Button>
  );
}

export type DeleteOverlayButtonProps = ButtonProps & {
  srLabel?: string;
};

export function DeleteOverlayButton({
  className,
  srLabel = 'Remove',
  variant = 'ghost',
  ...props
}: DeleteOverlayButtonProps): React.JSX.Element {
  return (
    <Button
      type="button"
      variant={variant}
      size="icon"
      className={cn(
        deleteIconButtonClassName,
        'bg-background/90 shadow-sm',
        className
      )}
      aria-label={srLabel}
      {...props}
    >
      <Trash2Icon
        className="size-4"
        aria-hidden
      />
    </Button>
  );
}

export type DeleteActionMenuItemProps = React.ComponentProps<
  typeof DropdownMenuItem
>;

export function DeleteActionMenuItem({
  className,
  children,
  ...props
}: DeleteActionMenuItemProps): React.JSX.Element {
  return (
    <DropdownMenuItem
      className={cn(deleteActionMenuItemClassName, className)}
      {...props}
    >
      <Trash2Icon
        className="size-4 shrink-0"
        aria-hidden
      />
      <span>{children}</span>
    </DropdownMenuItem>
  );
}

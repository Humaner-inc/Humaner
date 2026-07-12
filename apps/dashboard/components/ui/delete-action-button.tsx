'use client';

import * as React from 'react';
import { Trash2Icon } from '@humaner/shared/icons';

import { Button, type ButtonProps } from '@/components/ui/button';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export const deleteActionGroupClassName = 'group/delete';

export const deleteActionSurfaceClassName =
  '!bg-destructive !text-destructive-foreground hover:!bg-destructive/90 focus-visible:!bg-destructive/90';

/** Icon that slides in on hover for labeled delete actions. */
export const deleteActionIconClassName =
  'w-0 min-w-0 shrink-0 -translate-x-1 overflow-hidden text-destructive-foreground opacity-0 transition-all duration-200 group-hover/delete:mr-1.5 group-hover/delete:w-4 group-hover/delete:translate-x-0 group-hover/delete:opacity-100 group-focus-visible/delete:mr-1.5 group-focus-visible/delete:w-4 group-focus-visible/delete:translate-x-0 group-focus-visible/delete:opacity-100';

/** Icon that fades in on hover for icon-only delete actions. */
export const deleteIconActionIconClassName =
  'size-4 shrink-0 text-destructive-foreground opacity-0 transition-opacity duration-200 group-hover/delete:opacity-100 group-focus-visible/delete:opacity-100';

export const deleteActionButtonClassName = cn(
  deleteActionGroupClassName,
  deleteActionSurfaceClassName,
  'shrink-0 font-mono'
);

export const deleteActionMenuItemClassName = cn(
  deleteActionGroupClassName,
  deleteActionSurfaceClassName,
  'mx-1 my-0.5 rounded-md focus:!bg-destructive/90 focus:!text-destructive-foreground'
);

export const deleteIconActionButtonClassName = cn(
  deleteActionGroupClassName,
  deleteActionSurfaceClassName
);

export const deleteOverlayButtonClassName = cn(
  deleteActionGroupClassName,
  deleteActionSurfaceClassName,
  'size-8 rounded-full shadow-sm'
);

export type DeleteActionButtonProps = ButtonProps;

export function DeleteActionButton({
  className,
  children,
  variant = 'destructive',
  size = 'sm',
  ...props
}: DeleteActionButtonProps): React.JSX.Element {
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn(deleteActionButtonClassName, className)}
      {...props}
    >
      <Trash2Icon
        className={deleteActionIconClassName}
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
  variant = 'destructive',
  ...props
}: DeleteIconActionButtonProps): React.JSX.Element {
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn(deleteIconActionButtonClassName, className)}
      aria-label={srLabel}
      {...props}
    >
      <Trash2Icon
        className={deleteIconActionIconClassName}
        aria-hidden
      />
      <span className="sr-only">{srLabel}</span>
    </Button>
  );
}

export type DeleteOverlayButtonProps = ButtonProps & {
  srLabel?: string;
};

/** Compact circular delete control for image overlays and tight toolbars. */
export function DeleteOverlayButton({
  className,
  srLabel = 'Remove',
  variant = 'destructive',
  ...props
}: DeleteOverlayButtonProps): React.JSX.Element {
  return (
    <Button
      type="button"
      variant={variant}
      size="icon"
      className={cn(deleteOverlayButtonClassName, className)}
      aria-label={srLabel}
      {...props}
    >
      <Trash2Icon
        className={deleteIconActionIconClassName}
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
        className={deleteActionIconClassName}
        aria-hidden
      />
      <span>{children}</span>
    </DropdownMenuItem>
  );
}

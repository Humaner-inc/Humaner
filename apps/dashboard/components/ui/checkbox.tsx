'use client';

import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';

import { CheckMark, MinusMark } from '@/components/ui/check-icon';
import { cn } from '@/lib/utils';

export type CheckboxElement = React.ElementRef<typeof CheckboxPrimitive.Root>;
export type CheckboxProps = React.ComponentPropsWithoutRef<
  typeof CheckboxPrimitive.Root
>;

const Checkbox = React.forwardRef<CheckboxElement, CheckboxProps>(
  ({ className, checked, ...props }, ref) => (
    <CheckboxPrimitive.Root
      ref={ref}
      checked={checked}
      className={cn(
        'peer size-4 shrink-0 rounded-none border border-muted-foreground/55 bg-transparent shadow-none transition-colors',
        'hover:border-foreground/75',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'data-[state=checked]:border-[var(--accent-color,#e1ccaf)]',
        'data-[state=checked]:bg-[color-mix(in_srgb,var(--accent-color,#e1ccaf)_14%,transparent)]',
        'data-[state=checked]:text-[var(--accent-color,#e1ccaf)]',
        'data-[state=indeterminate]:border-[var(--accent-color,#e1ccaf)]',
        'data-[state=indeterminate]:bg-[color-mix(in_srgb,var(--accent-color,#e1ccaf)_14%,transparent)]',
        'data-[state=indeterminate]:text-[var(--accent-color,#e1ccaf)]',
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
        {checked === 'indeterminate' ? (
          <MinusMark size={12} />
        ) : (
          <CheckMark size={12} />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
);
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };

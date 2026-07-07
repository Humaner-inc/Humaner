import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import {
  ctaPrimaryClassName,
  ctaSecondaryOnLightClassName
} from '@humaner/shared/cta';
import { Loader2Icon } from '@humaner/shared/icons';

import { cn } from '@/lib/utils';

const neutralCtaClasses = ctaPrimaryClassName;

const upgradeCtaClasses =
  'border border-[#070607]/14 bg-[#fff8f2] font-mono font-medium text-[#070607] shadow-sm transition-colors hover:border-transparent hover:bg-[#dc143c] hover:text-white dark:border-[#070607]/22 dark:bg-[#070607] dark:text-[#fff8f2] dark:hover:border-transparent dark:hover:bg-[#dc143c] dark:hover:text-white';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: neutralCtaClasses,
        upgrade: upgradeCtaClasses,
        accent:
          'bg-primary text-primary-foreground shadow hover:bg-primary/90',
        destructive:
          'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
        outline: ctaSecondaryOnLightClassName,
        secondary:
          'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-foreground underline-offset-4 hover:underline'
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8',
        icon: 'size-9'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
);

export type ButtonElement = HTMLButtonElement;
export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    loading?: boolean;
  };
const Button = React.forwardRef<ButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {asChild ? (
          children
        ) : (
          <>
            {loading && (
              <Loader2Icon
                className={cn('size-4 animate-spin', !!children && 'mr-2')}
              />
            )}
            {children}
          </>
        )}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };

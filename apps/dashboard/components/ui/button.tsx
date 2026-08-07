import * as React from 'react';
import {
  ctaPrimaryOnLightClassName,
  ctaSecondaryAdaptiveClassName
} from '@humaner/shared/cta';
import { Loader2Icon } from '@humaner/shared/icons';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

/** Brand chrome is always Humaner (not Self-Host zinc). */
const oss = false;

const dashboardCtaCaseClassName = 'normal-case';

const cloudNeutralCtaClasses = cn(
  ctaPrimaryOnLightClassName,
  dashboardCtaCaseClassName,
  // On dark shells stay cream; soft white lift on hover (never frame grey).
  'dark:bg-[#fff8f2] dark:text-[#070607] dark:hover:border-white dark:hover:bg-white dark:hover:text-[#070607]'
);

const cloudUpgradeCtaClasses =
  'border border-[#070607]/14 bg-[#fff8f2] font-mono font-medium text-[#070607] shadow-sm transition-colors hover:border-transparent hover:bg-[#e1ccaf] hover:text-[#070607] dark:border-[#070607]/22 dark:bg-[#070607] dark:text-[#fff8f2] dark:hover:border-transparent dark:hover:bg-[#e1ccaf] dark:hover:text-[#070607]';

const cloudOutlineClasses = cn(
  ctaSecondaryAdaptiveClassName,
  dashboardCtaCaseClassName
);

/** Self-Host — zinc; explicit rem radii (avoid rounded-md → --radius:0). */
const ossRadius = 'rounded-[0.5rem]';
const ossNeutralCtaClasses = cn(
  ossRadius,
  'border border-transparent bg-zinc-950 font-sans text-sm font-medium normal-case text-white shadow-none hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200'
);

const ossUpgradeCtaClasses = cn(
  ossRadius,
  'border border-zinc-300 bg-white font-sans text-sm font-medium normal-case text-zinc-950 shadow-none hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800'
);

const ossOutlineClasses = cn(
  ossRadius,
  'border border-zinc-300 bg-transparent font-sans text-sm font-medium normal-case text-zinc-950 shadow-none hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-800'
);

const buttonVariants = cva(
  cn(
    'inline-flex items-center justify-center text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
    oss ? ossRadius : 'rounded-md'
  ),
  {
    variants: {
      variant: {
        default: oss ? ossNeutralCtaClasses : cloudNeutralCtaClasses,
        upgrade: oss ? ossUpgradeCtaClasses : cloudUpgradeCtaClasses,
        accent: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
        destructive:
          'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
        outline: oss ? ossOutlineClasses : cloudOutlineClasses,
        secondary:
          'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-foreground underline-offset-4 hover:underline'
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: cn('h-8 px-3 text-xs', oss ? ossRadius : 'rounded-md'),
        lg: cn('h-10 px-8', oss ? ossRadius : 'rounded-md'),
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
        className={cn(buttonVariants({ variant, size }), className)}
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

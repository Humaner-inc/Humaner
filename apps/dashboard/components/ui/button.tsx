import * as React from 'react';
import { ctaSecondaryAdaptiveClassName } from '@humaner/shared/cta';
import { Loader2Icon } from '@humaner/shared/icons';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

/** Brand chrome is always Humaner (not Self-Host zinc). */
const oss = false;

const dashboardCtaCaseClassName = 'normal-case';

const cloudNeutralCtaClasses = cn(
  dashboardCtaCaseClassName,
  // Explicit pairs so cream/ink never fight (Compose was invisible on dark).
  'border border-[#0A0D0D]/15 bg-[#0A0D0D] font-mono text-xs font-medium uppercase tracking-wider text-[#fcf4ec]',
  'hover:bg-[#0A0D0D]/85 hover:text-[#fcf4ec]',
  'dark:border-white/20 dark:bg-[#fcf4ec] dark:text-[#0A0D0D]',
  'dark:hover:border-white dark:hover:bg-white dark:hover:text-[#0A0D0D]'
);

const cloudUpgradeCtaClasses =
  'border border-[#0A0D0D]/14 bg-[#fcf4ec] font-mono font-medium text-[#0A0D0D] shadow-sm transition-colors hover:border-transparent hover:bg-[#e0e1df] hover:text-[#0A0D0D] dark:border-[#0A0D0D]/22 dark:bg-[#0A0D0D] dark:text-[#fcf4ec] dark:hover:border-transparent dark:hover:bg-[#e0e1df] dark:hover:text-[#f2f2f2]';

const cloudOutlineClasses = cn(
  ctaSecondaryAdaptiveClassName,
  dashboardCtaCaseClassName
);

/** Self-Host — zinc; explicit rem radii (avoid rounded-md → --radius:0). */
const ossRadius = 'rounded-[0.5rem]';
const ossNeutralCtaClasses = cn(
  ossRadius,
  'border border-transparent bg-[#0A0D0D] font-sans text-sm font-medium normal-case text-white shadow-none hover:bg-[#18181b] dark:bg-[#f2f2f2] dark:text-[#0A0D0D] dark:hover:bg-[#eaeaea]'
);

const ossUpgradeCtaClasses = cn(
  ossRadius,
  'border border-[#eaeaea] bg-white font-sans text-sm font-medium normal-case text-[#0A0D0D] shadow-none hover:bg-[#f2f2f2] dark:border-[#1c1c1e] dark:bg-[#18181b] dark:text-[#f2f2f2] dark:hover:bg-[#1c1c1e]'
);

const ossOutlineClasses = cn(
  ossRadius,
  'border border-[#eaeaea] bg-transparent font-sans text-sm font-medium normal-case text-[#0A0D0D] shadow-none hover:bg-[#f2f2f2] dark:border-[#1c1c1e] dark:text-[#f2f2f2] dark:hover:bg-[#1c1c1e]'
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

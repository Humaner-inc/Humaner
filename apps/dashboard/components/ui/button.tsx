import * as React from 'react';
import { ctaSecondaryAdaptiveClassName } from '@humaner/shared/cta';
import { SquircleLoader } from '@humaner/shared/squircle-loader';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import {
  dashboardCtaRadiusClassName,
  dashboardRadiusClassName,
  dashboardSecondaryRadiusClassName
} from '@/lib/dashboard/surface-styles';
import { cn } from '@/lib/utils';

/** Brand chrome is always Humaner (not Self-Host zinc). */
const oss = false;

const dashboardCtaCaseClassName = 'normal-case';

const cloudNeutralCtaClasses = cn(
  dashboardCtaCaseClassName,
  // Explicit pairs so cream/ink never fight (Compose was invisible on dark).
  'border border-[#0A0D0D]/15 bg-[#0A0D0D] font-mono text-xs font-medium tracking-normal text-[#fcf4ec]',
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

/** Invert of `default` — same chrome, background fill instead of foreground. */
const cloudBackgroundCtaClasses = cn(
  dashboardCtaCaseClassName,
  'border border-[#0A0D0D]/15 bg-[#fcf4ec] font-mono text-xs font-medium tracking-normal text-[#0A0D0D]',
  'hover:bg-[#0A0D0D]/[0.04] hover:text-[#0A0D0D]',
  'dark:border-white/20 dark:bg-[#0A0D0D] dark:text-[#fcf4ec]',
  'dark:hover:border-white/40 dark:hover:bg-white/[0.06] dark:hover:text-[#fcf4ec]'
);

/** Primary and inverted CTAs share 16px; quiet secondary stays 14px. */
const ctaRadius = dashboardCtaRadiusClassName;
const secondaryRadius = dashboardSecondaryRadiusClassName;

/** Self-Host — zinc; explicit rem radii. */
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
    oss ? ossRadius : dashboardRadiusClassName
  ),
  {
    variants: {
      variant: {
        default: oss
          ? ossNeutralCtaClasses
          : cn(cloudNeutralCtaClasses, ctaRadius),
        background: oss
          ? ossUpgradeCtaClasses
          : cn(cloudBackgroundCtaClasses, ctaRadius),
        upgrade: oss
          ? ossUpgradeCtaClasses
          : cn(cloudUpgradeCtaClasses, ctaRadius),
        accent: cn(
          'bg-primary text-primary-foreground shadow hover:bg-primary/90',
          oss ? null : ctaRadius
        ),
        destructive: cn(
          'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
          oss ? null : secondaryRadius
        ),
        outline: oss ? ossOutlineClasses : cn(cloudOutlineClasses, ctaRadius),
        secondary: cn(
          'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
          oss ? null : secondaryRadius
        ),
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-foreground underline-offset-4 hover:underline'
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: cn('h-8 px-3 text-xs', oss ? ossRadius : null),
        lg: cn('h-10 px-8', oss ? ossRadius : null),
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
      disabled,
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
        disabled={disabled || loading}
        aria-busy={loading || undefined}
      >
        {asChild ? (
          children
        ) : (
          <>
            {loading ? (
              <SquircleLoader
                className={cn(!!children && 'mr-2')}
                color="currentColor"
              />
            ) : null}
            {children}
          </>
        )}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };

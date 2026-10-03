import * as React from 'react';
import {
  ctaPrimaryClassName,
  ctaPrimaryOnLightClassName,
  ctaSecondaryAdaptiveClassName
} from '@humaner/shared/cta';
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

/** Frosted ink on light / frosted cream on dark — New message, Send, etc. */
const cloudNeutralCtaClasses = cn(
  dashboardCtaCaseClassName,
  ctaPrimaryOnLightClassName,
  'dark:border-[#f2f2f2]/40 dark:bg-[#f2f2f2]/80 dark:text-[#0A0D0D]',
  'dark:shadow-[inset_0_1px_0_rgb(255_255_255_/_0.55)]',
  'dark:hover:border-white dark:hover:bg-[#f2f2f2]/95 dark:hover:text-[#0A0D0D]'
);

const cloudUpgradeCtaClasses = cn(
  dashboardCtaCaseClassName,
  ctaPrimaryClassName,
  'dark:border-[#0A0D0D]/20 dark:bg-[#0A0D0D]/85 dark:text-[#f2f2f2]',
  'dark:shadow-[inset_0_1px_0_rgb(255_255_255_/_0.12)]',
  'dark:hover:border-[#0A0D0D]/30 dark:hover:bg-[#0A0D0D]/95 dark:hover:text-[#f2f2f2]'
);

const cloudOutlineClasses = cn(
  ctaSecondaryAdaptiveClassName,
  dashboardCtaCaseClassName
);

/** Invert of `default` — cream glass on light, ink glass on dark. */
const cloudBackgroundCtaClasses = cn(
  dashboardCtaCaseClassName,
  ctaPrimaryClassName,
  'dark:border-[#0A0D0D]/20 dark:bg-[#0A0D0D]/85 dark:text-[#f2f2f2]',
  'dark:shadow-[inset_0_1px_0_rgb(255_255_255_/_0.12)]',
  'dark:hover:border-[#0A0D0D]/30 dark:hover:bg-[#0A0D0D]/95 dark:hover:text-[#f2f2f2]'
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
    'inline-flex items-center justify-center text-sm font-medium transition-[color,background-color,border-color,box-shadow,backdrop-filter] duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
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
          'border border-[#001afc]/50 bg-[#001afc]/85 text-[#F2F2F2] shadow-[inset_0_1px_0_rgb(255_255_255_/_0.18)] backdrop-blur-xl backdrop-saturate-150 hover:border-[#001afc]/70 hover:bg-[#001afc]/95',
          oss ? null : ctaRadius
        ),
        destructive: cn(
          'border border-destructive/40 bg-destructive/85 text-destructive-foreground shadow-[inset_0_1px_0_rgb(255_255_255_/_0.12)] backdrop-blur-xl backdrop-saturate-150 hover:bg-destructive/95',
          oss ? null : secondaryRadius
        ),
        outline: oss ? ossOutlineClasses : cn(cloudOutlineClasses, ctaRadius),
        secondary: cn(
          'border border-border/60 bg-secondary/80 text-secondary-foreground shadow-[inset_0_1px_0_rgb(255_255_255_/_0.12)] backdrop-blur-xl backdrop-saturate-150 hover:bg-secondary/90',
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

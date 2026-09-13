'use client';

import * as React from 'react';
import { SquircleLoader } from '@humaner/shared/squircle-loader';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const spinnerVariants = cva('flex-col items-center justify-center', {
  variants: {
    show: {
      true: 'flex',
      false: 'hidden'
    }
  },
  defaultVariants: {
    show: true
  }
});

export type SpinnerProps = VariantProps<typeof spinnerVariants> & {
  size?: 'small' | 'medium' | 'large';
  className?: string;
  children?: React.ReactNode;
};

function Spinner({
  show,
  children,
  className
}: SpinnerProps): React.JSX.Element {
  return (
    <span className={spinnerVariants({ show })}>
      <SquircleLoader className={className} />
      {children}
    </span>
  );
}

export type CenteredSpinnerProps = SpinnerProps & {
  containerClassName?: React.HTMLAttributes<HTMLDivElement>['className'];
};

function CenteredSpinner({
  containerClassName,
  ...props
}: CenteredSpinnerProps): React.JSX.Element {
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 flex select-none items-center justify-center opacity-65',
        containerClassName
      )}
    >
      <Spinner {...props} />
    </div>
  );
}
CenteredSpinner.displayName = 'CenteredSpinner';

export { CenteredSpinner, Spinner };

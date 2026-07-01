import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { AuthAppMockup } from '@/components/auth/auth-app-mockup';
import { glassLogoClassName, glassSurfaceClassName } from '@/components/auth/auth-form-styles';
import { Logo } from '@/components/ui/logo';
import { cn } from '@/lib/utils';

const containerVariants = cva(glassSurfaceClassName, {
  variants: {
    maxWidth: {
      sm: 'max-w-md',
      md: 'max-w-lg',
      lg: 'max-w-5xl'
    },
    showMockup: {
      true: 'w-full lg:grid lg:grid-cols-2',
      false: 'w-full'
    }
  },
  defaultVariants: {
    maxWidth: 'sm',
    showMockup: false
  }
});

export type AuthContainerProps = React.PropsWithChildren &
  VariantProps<typeof containerVariants> & {
    showLogo?: boolean;
  };

export function AuthContainer({
  maxWidth,
  showMockup = false,
  showLogo = !showMockup,
  children
}: AuthContainerProps): React.JSX.Element {
  return (
    <div
      className={cn(
        containerVariants({
          maxWidth: showMockup ? 'lg' : maxWidth,
          showMockup
        })
      )}
    >
      <div
        className={cn(
          'p-8 sm:p-10',
          showMockup && 'lg:flex lg:flex-col lg:justify-center'
        )}
      >
        {showLogo && (
          <Logo className={cn('mb-8 justify-center', glassLogoClassName)} />
        )}
        {children}
      </div>
      {showMockup && (
        <div className="relative hidden border-l border-[#070607]/10 lg:block">
          <AuthAppMockup />
        </div>
      )}
    </div>
  );
}

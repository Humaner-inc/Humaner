import * as React from 'react';

import { authLogoClassName } from '@/components/auth/auth-form-styles';
import { Logo } from '@/components/ui/logo';
import { cn } from '@/lib/utils';

export type AuthContainerProps = React.PropsWithChildren & {
  showLogo?: boolean;
  maxWidth?: 'sm' | 'md' | 'lg';
};

export function AuthContainer({
  showLogo = true,
  maxWidth = 'sm',
  children
}: AuthContainerProps): React.JSX.Element {
  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg'
  }[maxWidth];

  return (
    <div className={cn('mx-auto w-full', maxWidthClass)}>
      {showLogo ? (
        <div className="mb-5 flex justify-center">
          <Logo
            hideSymbol
            className={cn(authLogoClassName, '[&_span]:text-white')}
          />
        </div>
      ) : null}
      {children}
    </div>
  );
}

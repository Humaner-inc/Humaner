import * as React from 'react';

import { authLogoClassName } from '@/components/auth/auth-form-styles';
import { Logo } from '@/components/ui/logo';
import { cn } from '@/lib/utils';

export type AuthOnboardingCardShellProps = React.PropsWithChildren & {
  className?: string;
  maxWidth?: 'sm' | 'md';
  showLogo?: boolean;
};

export function AuthOnboardingCardShell({
  children,
  className,
  maxWidth = 'md',
  showLogo = true
}: AuthOnboardingCardShellProps): React.JSX.Element {
  const maxWidthClass = maxWidth === 'md' ? 'max-w-md' : 'max-w-sm';

  return (
    <div className={cn('mx-auto w-full', maxWidthClass, className)}>
      {showLogo ? (
        <div className="mb-5 flex flex-col items-center sm:mb-6">
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

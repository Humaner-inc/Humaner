import * as React from 'react';

import { authLogoClassName } from '@/components/auth/auth-form-styles';
import { Logo } from '@/components/ui/logo';
import { isOssDeployment } from '@/lib/deployment-mode';
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
  const oss = isOssDeployment();

  return (
    <div className={cn('mx-auto w-full', maxWidthClass, className)}>
      {showLogo ? (
        <div
          className={cn(
            'flex flex-col items-center',
            oss ? 'mb-4 gap-3' : 'mb-5 sm:mb-6'
          )}
        >
          <Logo
            hideSymbol={!oss}
            className={cn(
              authLogoClassName,
              oss ? '[&_span]:!text-zinc-950' : '[&_span]:text-white'
            )}
          />
          {oss ? (
            <div
              className="h-px w-10 bg-zinc-200"
              aria-hidden
            />
          ) : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}

import * as React from 'react';

import { authLogoClassName } from '@/components/auth/auth-form-styles';
import { Logo } from '@/components/ui/logo';
import { isOssDeployment } from '@/lib/deployment-mode';
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
  const oss = isOssDeployment();

  return (
    <div className={cn('mx-auto w-full', maxWidthClass)}>
      {showLogo ? (
        <div
          className={cn(
            'flex flex-col items-center',
            oss ? 'mb-4 gap-3' : 'mb-5'
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

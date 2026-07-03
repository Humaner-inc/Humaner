import * as React from 'react';
import Image from 'next/image';

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
          <Image
            src="/favicon.svg"
            alt=""
            width={64}
            height={64}
            className="size-16"
            priority
          />
        </div>
      ) : null}
      {children}
    </div>
  );
}

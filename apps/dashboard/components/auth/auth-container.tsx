import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { AuthAppMockup } from '@/components/auth/auth-app-mockup';
import { Logo } from '@/components/ui/logo';
import { cn } from '@/lib/utils';

const containerVariants = cva(
  'overflow-hidden rounded-[2rem] border border-white/20 bg-white/10 shadow-[0_40px_100px_-30px_rgb(0_0_0_/_0.45)] backdrop-blur-2xl',
  {
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
  }
);

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
          <Logo className="mb-8 justify-center gap-3 [&_img]:h-12 [&_span]:text-2xl [&_span]:text-white [&_svg]:brightness-0 [&_svg]:invert" />
        )}
        {children}
      </div>
      {showMockup && (
        <div className="relative hidden border-l border-white/10 lg:block">
          <AuthAppMockup />
        </div>
      )}
    </div>
  );
}

'use client';

import * as React from 'react';

import { AuthBackToMarketing } from '@/components/auth/auth-back-to-marketing';
import { AuthHeroPanel } from '@/components/auth/auth-hero-panel';
import {
  OnboardingThemeProvider,
  useOnboardingThemeClasses
} from '@/components/onboarding/onboarding-theme-context';
import { cn } from '@/lib/utils';

export type AuthLayoutFrameProps = React.PropsWithChildren<{
  showBackToMarketing?: boolean;
}>;

function AuthLayoutChrome({
  children,
  showBackToMarketing = false
}: AuthLayoutFrameProps): React.JSX.Element {
  const theme = useOnboardingThemeClasses();

  return (
    <div
      className={cn(
        'relative flex min-h-screen transition-colors duration-300',
        theme.pageBg
      )}
    >
      <main className="relative z-10 flex min-h-screen w-full flex-col items-center justify-center px-6 py-8 lg:w-1/2">
        {showBackToMarketing ? <AuthBackToMarketing /> : null}
        {children}
      </main>
      <div className="relative z-10 hidden lg:block lg:w-1/2">
        <div className="absolute inset-4 overflow-hidden rounded-2xl">
          <AuthHeroPanel />
        </div>
      </div>
    </div>
  );
}

export function AuthLayoutFrame({
  children,
  showBackToMarketing = false
}: AuthLayoutFrameProps): React.JSX.Element {
  return (
    <OnboardingThemeProvider className="min-h-screen">
      <AuthLayoutChrome showBackToMarketing={showBackToMarketing}>
        {children}
      </AuthLayoutChrome>
    </OnboardingThemeProvider>
  );
}

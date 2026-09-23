'use client';

import * as React from 'react';

import { AuthBackToMarketing } from '@/components/auth/auth-back-to-marketing';
import { AuthHeroPanel } from '@/components/auth/auth-hero-panel';
import {
  AuthThemeProvider,
  useAuthThemeClasses,
  type AuthAppearance
} from '@/components/auth/auth-theme-context';
import { GrainAmbient } from '@/components/ui/grain-ambient';
import { cn } from '@/lib/utils';

export type AuthLayoutFrameProps = React.PropsWithChildren<{
  showBackToMarketing?: boolean;
  initialAppearance?: AuthAppearance;
}>;

function AuthLayoutChrome({
  children,
  showBackToMarketing = false
}: AuthLayoutFrameProps): React.JSX.Element {
  const theme = useAuthThemeClasses();

  return (
    <div
      className={cn(
        'relative min-h-screen transition-colors duration-300',
        theme.pageBg
      )}
    >
      {theme.isInverted && theme.showGrain ? (
        <GrainAmbient className="absolute inset-0" />
      ) : null}
      {showBackToMarketing ? <AuthBackToMarketing /> : null}
      <div
        className={cn(
          'grid min-h-screen items-center justify-items-center px-6 py-8',
          'lg:grid-cols-[minmax(1.5rem,1fr)_24rem_minmax(12rem,1fr)_auto_minmax(1.5rem,1fr)] lg:justify-items-stretch lg:px-0'
        )}
      >
        <main className="relative z-10 w-full max-w-sm lg:col-start-2 lg:w-96 lg:max-w-none">
          {children}
        </main>
        <div className="relative z-10 hidden lg:col-start-4 lg:block">
          <AuthHeroPanel />
        </div>
      </div>
    </div>
  );
}

export function AuthLayoutFrame({
  children,
  showBackToMarketing = false,
  initialAppearance
}: AuthLayoutFrameProps): React.JSX.Element {
  return (
    <AuthThemeProvider
      className="min-h-screen"
      initialAppearance={initialAppearance}
    >
      <AuthLayoutChrome showBackToMarketing={showBackToMarketing}>
        {children}
      </AuthLayoutChrome>
    </AuthThemeProvider>
  );
}

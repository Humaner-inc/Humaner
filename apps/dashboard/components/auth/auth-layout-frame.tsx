'use client';

import * as React from 'react';

import { AuthBackToMarketing } from '@/components/auth/auth-back-to-marketing';
import { AuthHeroPanel } from '@/components/auth/auth-hero-panel';
import { AuthThemeProvider } from '@/components/auth/auth-theme-context';
import { cn } from '@/lib/utils';

export type AuthLayoutFrameProps = React.PropsWithChildren<{
  showBackToMarketing?: boolean;
}>;

function AuthLayoutChrome({
  children,
  showBackToMarketing = false
}: AuthLayoutFrameProps): React.JSX.Element {
  return (
    <div className="relative min-h-screen lg:grid lg:grid-cols-2">
      {showBackToMarketing ? <AuthBackToMarketing /> : null}

      {/* Left — black, form */}
      <div className="relative z-10 flex min-h-screen items-center justify-center bg-[#0a0d0d] px-6 py-8">
        <main className="w-full max-w-sm">{children}</main>
      </div>

      {/* Right — light, CollabInbox */}
      <div
        className={cn(
          'relative hidden min-h-screen overflow-hidden bg-[#f2f2f2]',
          'lg:flex lg:items-end lg:justify-center'
        )}
      >
        <AuthHeroPanel className="auth-collab-inbox--panel w-full max-w-[42rem] px-6 pb-0" />
      </div>
    </div>
  );
}

export function AuthLayoutFrame({
  children,
  showBackToMarketing = false
}: AuthLayoutFrameProps): React.JSX.Element {
  return (
    <AuthThemeProvider className="min-h-screen">
      <AuthLayoutChrome showBackToMarketing={showBackToMarketing}>
        {children}
      </AuthLayoutChrome>
    </AuthThemeProvider>
  );
}

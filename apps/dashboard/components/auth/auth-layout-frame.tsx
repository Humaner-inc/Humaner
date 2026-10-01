'use client';

import * as React from 'react';

import { AuthBackToMarketing } from '@/components/auth/auth-back-to-marketing';
import { AuthHeroPanel } from '@/components/auth/auth-hero-panel';
import {
  AuthThemeProvider,
  useAuthThemeClasses
} from '@/components/auth/auth-theme-context';
import { cn } from '@/lib/utils';

export type AuthLayoutFrameProps = React.PropsWithChildren<{
  showBackToMarketing?: boolean;
  /** CollabInbox SVG markup from the server — keeps the scene out of client fetch. */
  mailboxSvg?: string;
}>;

function AuthLayoutChrome({
  children,
  showBackToMarketing = false,
  mailboxSvg = ''
}: AuthLayoutFrameProps): React.JSX.Element {
  const theme = useAuthThemeClasses();
  const inverted = theme.isInverted;

  return (
    <div
      className={cn(
        'relative min-h-screen transition-colors duration-300',
        inverted ? 'bg-white' : 'bg-[#0A0D0D]'
      )}
    >
      {showBackToMarketing ? <AuthBackToMarketing /> : null}

      {/* Portal stays vertically centered; art is pinned to the page bottom. */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-10 sm:py-14">
        <main className="w-full max-w-sm">{children}</main>
      </div>

      {mailboxSvg ? (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-0 flex justify-center overflow-hidden"
          aria-hidden
        >
          <AuthHeroPanel
            markup={mailboxSvg}
            className="auth-collab-inbox--bottom w-full max-w-[min(42rem,92vw)]"
          />
        </div>
      ) : null}
    </div>
  );
}

export function AuthLayoutFrame({
  children,
  showBackToMarketing = false,
  mailboxSvg = ''
}: AuthLayoutFrameProps): React.JSX.Element {
  return (
    <AuthThemeProvider className="min-h-screen">
      <AuthLayoutChrome
        showBackToMarketing={showBackToMarketing}
        mailboxSvg={mailboxSvg}
      >
        {children}
      </AuthLayoutChrome>
    </AuthThemeProvider>
  );
}

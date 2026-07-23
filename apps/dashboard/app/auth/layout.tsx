import * as React from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import { redirect } from 'next/navigation';

import { GrainAmbient } from '@/components/ui/grain-ambient';
import { Routes } from '@/constants/routes';
import { dedupedAuth } from '@/lib/auth';
import { createPageMetadata } from '@/lib/metadata/create-page-metadata';
import { getPathname } from '@/lib/network/get-pathname';

const AUTH_TITLES: Record<string, string> = {
  [Routes.Login]: 'Log in',
  [Routes.SignUp]: 'Sign up',
  [Routes.ForgotPassword]: 'Forgot password',
  [Routes.ForgotPasswordSuccess]: 'Forgot password',
  [Routes.ResetPassword]: 'Reset password',
  [Routes.VerifyEmail]: 'Verify email',
  [Routes.Totp]: 'Two-factor authentication',
  [Routes.RecoveryCode]: 'Recovery code',
  [Routes.Logout]: 'Log out'
};

export function generateMetadata(): Metadata {
  const pathname = getPathname() ?? Routes.Login;
  const title =
    AUTH_TITLES[pathname] ??
    (pathname.startsWith(Routes.Auth) ? 'Auth' : 'Auth');
  return createPageMetadata(pathname, title);
}

function isChangeEmailRoute(): boolean {
  const pathname = getPathname();
  return !!pathname && pathname.startsWith(Routes.ChangeEmail);
}

function isLogoutRoute(): boolean {
  const pathname = getPathname();
  return !!pathname && pathname.startsWith(Routes.Logout);
}

export default async function AuthLayout({
  children
}: React.PropsWithChildren): Promise<React.JSX.Element> {
  const session = await dedupedAuth();
  if (!isChangeEmailRoute() && !isLogoutRoute() && session) {
    return redirect(Routes.Home);
  }
  return (
    <div className="relative flex min-h-screen bg-[#070607]">
      <GrainAmbient className="fixed inset-0 z-0" />
      {/* Left: auth form */}
      <main className="relative z-10 flex min-h-screen w-full flex-col items-center justify-center px-6 py-8 lg:w-1/2">
        {children}
      </main>
      {/* Right: image panel */}
      <div className="relative z-10 hidden lg:block lg:w-1/2">
        <div className="absolute inset-4 overflow-hidden rounded-2xl">
          <Image
            src="/lazy_work.png"
            alt=""
            fill
            className="object-cover object-center"
            priority
            sizes="50vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070607]/30 via-transparent to-transparent" />
        </div>
      </div>
    </div>
  );
}

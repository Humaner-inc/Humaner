import * as React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { Routes } from '@/constants/routes';
import { dedupedAuth } from '@/lib/auth';
import { getPathname } from '@/lib/network/get-pathname';
import { createTitle } from '@/lib/utils';

export const metadata: Metadata = {
  title: createTitle('Auth')
};

function isChangeEmailRoute(): boolean {
  const pathname = getPathname();
  return !!pathname && pathname.startsWith(Routes.ChangeEmail);
}

export default async function AuthLayout({
  children
}: React.PropsWithChildren): Promise<React.JSX.Element> {
  const session = await dedupedAuth();
  if (!isChangeEmailRoute() && session) {
    return redirect(Routes.Home);
  }
  return (
    <div className="relative min-h-screen">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/burgundy.png)' }}
        role="img"
        aria-label=""
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/45" />
      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-8">
        {children}
      </main>
    </div>
  );
}

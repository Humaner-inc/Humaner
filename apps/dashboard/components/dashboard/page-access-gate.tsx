'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { Routes } from '@/constants/routes';
import { canAccessPathname } from '@/lib/auth/workspace-access';
import type { ProfileDto } from '@/types/dtos/profile-dto';

export type PageAccessGateProps = {
  profile: ProfileDto;
  children: React.ReactNode;
};

export function PageAccessGate({
  profile,
  children
}: PageAccessGateProps): React.JSX.Element {
  const pathname = usePathname();
  const router = useRouter();

  React.useEffect(() => {
    if (!canAccessPathname(profile, pathname)) {
      router.replace(Routes.Home);
    }
  }, [pathname, profile, router]);

  if (!canAccessPathname(profile, pathname)) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
        You don&apos;t have access to this page.
      </div>
    );
  }

  return <>{children}</>;
}

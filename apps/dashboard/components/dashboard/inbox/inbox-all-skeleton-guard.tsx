'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';

import { InboxPageLoader } from '@/components/dashboard/inbox/inbox-page-loader';
import { isInboxAllPath } from '@/lib/inbox/is-inbox-all-path';

/** Replaces a prerendered pulse skeleton the moment we know this is /inbox/all. */
export function InboxAllSkeletonGuard({
  children,
  fill = 'slot'
}: {
  children: React.ReactNode;
  fill?: 'slot' | 'screen';
}): React.JSX.Element {
  const pathname = usePathname();
  if (isInboxAllPath(pathname)) {
    return <InboxPageLoader fill={fill} />;
  }
  return <>{children}</>;
}

import * as React from 'react';
import { type Metadata } from 'next';

import { AnnotatedLayout } from '@/components/ui/annotated';
import { Separator } from '@/components/ui/separator';
import { session } from '@/lib/auth/session';
import { createTitle } from '@/lib/utils';

export const metadata: Metadata = {
  title: createTitle('Security')
};

export type SecurityLayoutProps = {
  changePassword: React.ReactNode;
  connectedAccounts: React.ReactNode;
  multiFactorAuthentication: React.ReactNode;
  manageSessions: React.ReactNode;
};

export default function SecurityLayout({
  changePassword,
  connectedAccounts,
  multiFactorAuthentication,
  manageSessions
}: SecurityLayoutProps): React.JSX.Element {
  return (
    <AnnotatedLayout className="py-0">
      {changePassword}
      <Separator />
      {connectedAccounts}
      <Separator />
      {multiFactorAuthentication}
      {session.strategy === 'database' && (
        <>
          <Separator />
          {manageSessions}
        </>
      )}
    </AnnotatedLayout>
  );
}

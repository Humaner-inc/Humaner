import * as React from 'react';

import { AnnotatedLayout } from '@/components/ui/annotated';
import { Separator } from '@/components/ui/separator';
import { session } from '@/lib/auth/session';

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

import * as React from 'react';
import { type Metadata } from 'next';

import { AuthContainer } from '@/components/auth/auth-container';
import { LogoutCard } from '@/components/auth/logout/logout-card';
import { createTitle } from '@/lib/utils';

export const metadata: Metadata = {
  title: createTitle('Logged out')
};

export default async function LogoutPage(): Promise<React.JSX.Element> {
  return (
    <AuthContainer maxWidth="sm">
      <LogoutCard />
    </AuthContainer>
  );
}

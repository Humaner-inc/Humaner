import * as React from 'react';
import { type Metadata } from 'next';

import { AuthContainer } from '@/components/auth/auth-container';
import { ChangeEmailInvalidCard } from '@/components/auth/change-email/change-email-invalid-card';
import { createTitle } from '@/lib/utils';

export const metadata: Metadata = {
  title: createTitle('Invalid change request')
};

export default function ChangeEmailInvalidPage(): React.JSX.Element {
  return (
    <AuthContainer maxWidth="sm">
      <ChangeEmailInvalidCard />
    </AuthContainer>
  );
}

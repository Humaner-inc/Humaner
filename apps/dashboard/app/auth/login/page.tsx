import * as React from 'react';
import { type Metadata } from 'next';

import { AuthOnboardingCardShell } from '@/components/auth/auth-onboarding-card-shell';
import { LoginCard } from '@/components/auth/login/login-card';
import { createTitle } from '@/lib/utils';

export const metadata: Metadata = {
  title: createTitle('Log in')
};

export default async function LoginPage(): Promise<React.JSX.Element> {
  return (
    <AuthOnboardingCardShell
      showLogo={false}
      maxWidth="sm"
    >
      <LoginCard />
    </AuthOnboardingCardShell>
  );
}

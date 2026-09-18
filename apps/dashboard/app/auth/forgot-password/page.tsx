import * as React from 'react';
import { type Metadata } from 'next';

import { AuthOnboardingCardShell } from '@/components/auth/auth-onboarding-card-shell';
import { ForgotPasswordCard } from '@/components/auth/forgot-password/forgot-password-card';
import { createTitle } from '@/lib/utils';

export const metadata: Metadata = {
  title: createTitle('Forgot password')
};

export default function ForgotPasswordPage(): React.JSX.Element {
  return (
    <AuthOnboardingCardShell
      showLogo={false}
      maxWidth="sm"
    >
      <ForgotPasswordCard />
    </AuthOnboardingCardShell>
  );
}

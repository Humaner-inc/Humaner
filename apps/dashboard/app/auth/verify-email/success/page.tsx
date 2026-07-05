import * as React from 'react';
import { type Metadata } from 'next';

import { AuthOnboardingCardShell } from '@/components/auth/auth-onboarding-card-shell';
import { VerifyEmailSuccessCard } from '@/components/auth/verify-email/verify-email-success-card';
import { createTitle } from '@/lib/utils';

export const metadata: Metadata = {
  title: createTitle('Email Verification Success')
};

export default async function EmailVerificationSuccessPage(): Promise<React.JSX.Element> {
  return (
    <AuthOnboardingCardShell>
      <VerifyEmailSuccessCard />
    </AuthOnboardingCardShell>
  );
}

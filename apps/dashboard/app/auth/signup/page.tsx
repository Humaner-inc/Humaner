import * as React from 'react';
import { type Metadata } from 'next';
import { InvitationStatus } from '@prisma/client';
import { createSearchParamsCache, parseAsString } from 'nuqs/server';
import { validate as uuidValidate } from 'uuid';

import { AuthOnboardingCardShell } from '@/components/auth/auth-onboarding-card-shell';
import { SignUpCard } from '@/components/auth/sign-up/sign-up-card';
import { prisma } from '@/lib/db/prisma';
import { createTitle } from '@/lib/utils';
import type { SignUpIntent } from '@/schemas/auth/sign-up-schema';
import type { NextPageProps } from '@/types/next-page-props';

const searchParamsCache = createSearchParamsCache({
  intent: parseAsString.withDefault(''),
  invitation: parseAsString.withDefault(''),
  email: parseAsString.withDefault('')
});

export const metadata: Metadata = {
  title: createTitle('Sign up')
};

async function SignUpPageContent({
  searchParams
}: Pick<NextPageProps, 'searchParams'>): Promise<React.JSX.Element> {
  const {
    intent: intentParam,
    invitation: invitationToken,
    email: emailParam
  } = await searchParamsCache.parse(searchParams);

  let initialIntent: SignUpIntent =
    intentParam === 'team_member' ? 'team_member' : 'business_owner';
  let invitationId: string | undefined;
  let invitationEmail: string | undefined;
  let organizationName: string | undefined;
  let lockIntent = false;

  if (invitationToken && uuidValidate(invitationToken)) {
    const invitation = await prisma.invitation.findFirst({
      where: {
        token: invitationToken,
        status: InvitationStatus.PENDING
      },
      select: {
        id: true,
        email: true,
        organization: { select: { name: true } }
      }
    });
    if (invitation) {
      initialIntent = 'team_member';
      invitationId = invitation.id;
      invitationEmail = invitation.email;
      organizationName = invitation.organization.name;
      lockIntent = true;
    }
  } else if (emailParam) {
    invitationEmail = emailParam;
  }

  return (
    <AuthOnboardingCardShell
      showLogo={false}
      maxWidth="sm"
    >
      <SignUpCard
        initialIntent={initialIntent}
        invitationId={invitationId}
        invitationEmail={invitationEmail}
        organizationName={organizationName}
        lockIntent={lockIntent}
      />
    </AuthOnboardingCardShell>
  );
}

function SignUpFallback(): React.JSX.Element {
  return (
    <AuthOnboardingCardShell
      showLogo={false}
      maxWidth="sm"
    >
      <SignUpCard initialIntent="business_owner" />
    </AuthOnboardingCardShell>
  );
}

export default function SignUpPage(props: NextPageProps): React.JSX.Element {
  return (
    <React.Suspense fallback={<SignUpFallback />}>
      <SignUpPageContent searchParams={props.searchParams} />
    </React.Suspense>
  );
}

import * as React from 'react';
import { type Metadata } from 'next';
import { redirect } from 'next/navigation';

import { McpOAuthConsentForm } from '@/components/oauth/mcp-oauth-consent-form';
import { Routes } from '@/constants/routes';
import { dedupedAuth } from '@/lib/auth';
import { checkAuthenticatedSession, checkSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import {
  parseMcpOAuthScopes,
  redirectUriMatches
} from '@/lib/developers/mcp-oauth';
import { findMcpOAuthClient } from '@/lib/developers/mcp-oauth-store';
import { createTitle } from '@/lib/utils';
import type { NextPageProps } from '@/types/next-page-props';

export const metadata: Metadata = {
  title: createTitle('Connect MCP')
};

export default async function McpOAuthConsentPage({
  searchParams
}: NextPageProps): Promise<React.JSX.Element> {
  const session = await dedupedAuth();
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') {
      query.set(key, value);
    }
  }

  if (!checkAuthenticatedSession(session)) {
    redirect(
      `${Routes.Login}?${new URLSearchParams({
        callbackUrl: `${Routes.McpOAuthConsent}?${query}`
      })}`
    );
  }
  if (!checkSession(session)) {
    redirect(Routes.OnboardingConnectGmail);
  }

  const clientId = query.get('client_id') ?? '';
  const redirectUri = query.get('redirect_uri') ?? '';
  const codeChallenge = query.get('code_challenge') ?? '';
  const client = clientId ? await findMcpOAuthClient(clientId) : null;
  if (
    !client ||
    !redirectUriMatches(client.redirectUris, redirectUri) ||
    !codeChallenge
  ) {
    redirect(Routes.Developers);
  }

  const organization = await prisma.organization.findUnique({
    where: { id: session.user.organizationId },
    select: { name: true }
  });

  return (
    <McpOAuthConsentForm
      clientName={client.clientName}
      workspaceName={organization?.name ?? 'this workspace'}
      clientId={client.clientId}
      redirectUri={redirectUri}
      codeChallenge={codeChallenge}
      state={query.get('state') ?? ''}
      defaultScopes={parseMcpOAuthScopes(query.get('scope'))}
    />
  );
}

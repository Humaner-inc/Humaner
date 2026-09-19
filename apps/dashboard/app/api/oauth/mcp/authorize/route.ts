import { NextResponse, type NextRequest } from 'next/server';

import { Routes } from '@/constants/routes';
import { dedupedAuth } from '@/lib/auth';
import { checkAuthenticatedSession } from '@/lib/auth/session';
import { mcpConsentUrl, redirectUriMatches } from '@/lib/developers/mcp-oauth';
import { findMcpOAuthClient } from '@/lib/developers/mcp-oauth-store';

export async function GET(request: NextRequest): Promise<Response> {
  const params = request.nextUrl.searchParams;
  const clientId = params.get('client_id') ?? '';
  const redirectUri = params.get('redirect_uri') ?? '';
  const responseType = params.get('response_type') ?? '';
  const codeChallenge = params.get('code_challenge') ?? '';
  const method = params.get('code_challenge_method') ?? '';
  const state = params.get('state');

  const client = clientId ? await findMcpOAuthClient(clientId) : null;
  if (!client || !redirectUriMatches(client.redirectUris, redirectUri)) {
    return NextResponse.json(
      {
        error: 'invalid_request',
        error_description: 'Unknown client or redirect URI.'
      },
      { status: 400 }
    );
  }

  if (responseType !== 'code' || !codeChallenge || method !== 'S256') {
    const error = new URL(redirectUri);
    error.searchParams.set('error', 'invalid_request');
    if (state) {
      error.searchParams.set('state', state);
    }
    return NextResponse.redirect(error);
  }

  const session = await dedupedAuth();
  const consent = mcpConsentUrl(params);
  if (!checkAuthenticatedSession(session)) {
    const login = new URL(Routes.Login, request.url);
    login.searchParams.set('callbackUrl', consent);
    return NextResponse.redirect(login);
  }

  return NextResponse.redirect(new URL(consent, request.url));
}

import { NextResponse, type NextRequest } from 'next/server';

import {
  isAllowedMcpRedirectUri,
  mcpOAuthCorsHeaders
} from '@/lib/developers/mcp-oauth';
import { registerMcpOAuthClient } from '@/lib/developers/mcp-oauth-store';

export function OPTIONS(): Response {
  return new Response(null, {
    status: 204,
    headers: mcpOAuthCorsHeaders()
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: {
    client_name?: unknown;
    redirect_uris?: unknown;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json(
      { error: 'invalid_request', error_description: 'JSON body required.' },
      { status: 400, headers: mcpOAuthCorsHeaders() }
    );
  }

  const redirectUris = Array.isArray(body.redirect_uris)
    ? body.redirect_uris.filter(
        (item): item is string => typeof item === 'string'
      )
    : [];
  if (
    redirectUris.length === 0 ||
    !redirectUris.every(isAllowedMcpRedirectUri)
  ) {
    return NextResponse.json(
      {
        error: 'invalid_redirect_uri',
        error_description: 'Register a loopback, https, or editor callback URL.'
      },
      { status: 400, headers: mcpOAuthCorsHeaders() }
    );
  }

  const clientName =
    typeof body.client_name === 'string' && body.client_name.trim()
      ? body.client_name.trim()
      : 'MCP client';
  const created = await registerMcpOAuthClient({
    clientName,
    redirectUris
  });

  return NextResponse.json(
    {
      client_id: created.clientId,
      client_name: created.clientName,
      redirect_uris: created.redirectUris,
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      token_endpoint_auth_method: 'none',
      client_id_issued_at: Math.floor(Date.now() / 1000)
    },
    { status: 201, headers: mcpOAuthCorsHeaders() }
  );
}

import { NextResponse, type NextRequest } from 'next/server';

import {
  MCP_ACCESS_TOKEN_TTL_SECONDS,
  mcpOAuthCorsHeaders
} from '@/lib/developers/mcp-oauth';
import {
  exchangeMcpAuthorizationCode,
  refreshMcpAccessToken
} from '@/lib/developers/mcp-oauth-store';
import {
  checkBucketRateLimit,
  rateLimitedHeaders
} from '@/lib/security/api-rate-limit';
import { getClientIp } from '@/lib/security/client-ip';

export function OPTIONS(): Response {
  return new Response(null, {
    status: 204,
    headers: mcpOAuthCorsHeaders()
  });
}

async function readTokenBody(
  request: NextRequest
): Promise<Record<string, string>> {
  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    const json = (await request.json()) as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(json).flatMap(([key, value]) =>
        typeof value === 'string' ? [[key, value]] : []
      )
    );
  }
  const form = await request.formData();
  const body: Record<string, string> = {};
  for (const [key, value] of form.entries()) {
    if (typeof value === 'string') {
      body[key] = value;
    }
  }
  return body;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const limited = await checkBucketRateLimit({
    bucket: 'oauth-token',
    identifier: getClientIp(request),
    limit: 60,
    windowSeconds: 60
  });
  if (limited.limited) {
    return NextResponse.json(
      { error: 'slow_down', error_description: 'Too many requests.' },
      {
        status: 429,
        headers: {
          ...mcpOAuthCorsHeaders(),
          ...rateLimitedHeaders(limited.retryAfterSeconds)
        }
      }
    );
  }

  let body: Record<string, string>;
  try {
    body = await readTokenBody(request);
  } catch {
    return NextResponse.json(
      { error: 'invalid_request' },
      { status: 400, headers: mcpOAuthCorsHeaders() }
    );
  }

  const grantType = body.grant_type ?? '';
  const clientId = body.client_id ?? '';

  if (grantType === 'authorization_code') {
    const exchanged = await exchangeMcpAuthorizationCode({
      code: body.code ?? '',
      clientId,
      redirectUri: body.redirect_uri ?? '',
      codeVerifier: body.code_verifier ?? ''
    });
    if (!exchanged.ok) {
      return NextResponse.json(
        { error: 'invalid_grant', error_description: exchanged.message },
        { status: 400, headers: mcpOAuthCorsHeaders() }
      );
    }
    return NextResponse.json(
      {
        access_token: exchanged.accessToken,
        token_type: 'Bearer',
        expires_in: MCP_ACCESS_TOKEN_TTL_SECONDS,
        refresh_token: exchanged.refreshToken,
        scope: exchanged.scopes.join(' ')
      },
      { headers: mcpOAuthCorsHeaders() }
    );
  }

  if (grantType === 'refresh_token') {
    const refreshed = await refreshMcpAccessToken({
      refreshToken: body.refresh_token ?? '',
      clientId
    });
    if (!refreshed.ok) {
      return NextResponse.json(
        { error: 'invalid_grant', error_description: refreshed.message },
        { status: 400, headers: mcpOAuthCorsHeaders() }
      );
    }
    return NextResponse.json(
      {
        access_token: refreshed.accessToken,
        token_type: 'Bearer',
        expires_in: MCP_ACCESS_TOKEN_TTL_SECONDS,
        refresh_token: refreshed.refreshToken,
        scope: refreshed.scopes.join(' ')
      },
      { headers: mcpOAuthCorsHeaders() }
    );
  }

  return NextResponse.json(
    { error: 'unsupported_grant_type' },
    { status: 400, headers: mcpOAuthCorsHeaders() }
  );
}

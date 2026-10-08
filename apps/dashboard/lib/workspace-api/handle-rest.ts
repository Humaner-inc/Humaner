import { NextResponse, type NextRequest } from 'next/server';

import { workspaceToolAllowedOnDeployment } from '@/lib/oss-surface';
import { rateLimitedHeaders } from '@/lib/security/api-rate-limit';
import { authorizeWorkspaceRequest } from '@/lib/workspace-api/authorize';
import { executeWorkspaceTool } from '@/lib/workspace-api/execute-tools';

function corsHeaders(allowOrigin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers':
      'Content-Type, Authorization, X-Humaner-Agent-Id',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin'
  };
  if (allowOrigin) {
    headers['Access-Control-Allow-Origin'] = allowOrigin;
  }
  return headers;
}

function jsonError(
  status: number,
  message: string,
  allowOrigin: string | null,
  retryAfterSeconds?: number
): NextResponse {
  return NextResponse.json(
    { error: message },
    {
      status,
      headers: {
        ...corsHeaders(allowOrigin),
        ...(retryAfterSeconds ? rateLimitedHeaders(retryAfterSeconds) : {})
      }
    }
  );
}

export async function handleWorkspaceOptions(
  request: NextRequest
): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request.headers.get('origin') ?? '*')
  });
}

export async function handleWorkspaceRest(
  request: NextRequest,
  tool: string
): Promise<Response> {
  if (!workspaceToolAllowedOnDeployment(tool)) {
    return jsonError(404, 'Unknown tool.', request.headers.get('origin'));
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonError(400, 'Invalid JSON body.', request.headers.get('origin'));
  }

  const auth = await authorizeWorkspaceRequest({ request, tool });
  if (!auth.ok) {
    return jsonError(
      auth.status,
      auth.message,
      auth.allowOrigin,
      auth.retryAfterSeconds
    );
  }

  const result = await executeWorkspaceTool(tool, body, auth.context);
  if (!result.ok) {
    return jsonError(400, result.error ?? 'Tool failed.', auth.allowOrigin);
  }

  return NextResponse.json(result.data, {
    headers: corsHeaders(auth.allowOrigin)
  });
}

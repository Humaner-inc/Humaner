import { NextResponse, type NextRequest } from 'next/server';

import {
  mcpAppUrlFromRequest,
  mcpOAuthCorsHeaders,
  mcpProtectedResourceMetadata
} from '@/lib/developers/mcp-oauth';

export function OPTIONS(): Response {
  return new Response(null, {
    status: 204,
    headers: mcpOAuthCorsHeaders()
  });
}

export function GET(request: NextRequest): NextResponse {
  return NextResponse.json(
    mcpProtectedResourceMetadata(mcpAppUrlFromRequest(request)),
    {
      headers: mcpOAuthCorsHeaders()
    }
  );
}

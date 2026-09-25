import 'server-only';

import { after } from 'next/server';
import type { NextRequest } from 'next/server';

import { verifyApiKey } from '@/lib/auth/api-keys';
import { prisma } from '@/lib/db/prisma';
import { extractBearerToken } from '@/lib/security/authorize-public-agent-request';

const MAX_ERROR_LENGTH = 500;

export type McpLogActor = {
  organizationId: string;
  apiKeyId: string | null;
  oauthGrantId?: string | null;
};

export type McpRequestLogInput = {
  organizationId: string;
  method: string;
  tool?: string;
  status: number;
  durationMs: number;
  apiKeyId?: string | null;
  oauthGrantId?: string | null;
  errorMessage?: string;
};

export async function resolveMcpLogActor(
  request: NextRequest
): Promise<McpLogActor | null> {
  const bearer = extractBearerToken(request);
  if (!bearer) {
    return null;
  }
  const verified = await verifyApiKey(bearer);
  if (!verified.success) {
    return null;
  }
  return {
    organizationId: verified.organizationId,
    apiKeyId: verified.id
  };
}

/**
 * Records one MCP JSON-RPC call. Scheduled with after() so persistence never
 * delays the response. A logging failure must not fail the caller.
 */
export function logMcpRequest(input: McpRequestLogInput): void {
  after(async () => {
    try {
      await prisma.mcpRequestLog.create({
        data: {
          organizationId: input.organizationId,
          method: input.method.slice(0, 64),
          tool: (input.tool ?? '').slice(0, 64),
          status: input.status,
          durationMs: input.durationMs,
          apiKeyId: input.apiKeyId ?? undefined,
          mcpOAuthGrantId: input.oauthGrantId ?? undefined,
          errorMessage: input.errorMessage?.slice(0, MAX_ERROR_LENGTH)
        }
      });
    } catch (error) {
      console.error('[mcp] Failed to write request log', error);
    }
  });
}

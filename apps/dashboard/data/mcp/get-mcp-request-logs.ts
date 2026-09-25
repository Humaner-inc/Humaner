import 'server-only';

import { redirect } from 'next/navigation';

import { dedupedAuth } from '@/lib/auth';
import { getLoginRedirect } from '@/lib/auth/redirect';
import { checkSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import type { McpRequestLogDto } from '@/types/dtos/mcp-request-log-dto';
import { SortDirection } from '@/types/sorty-direction';

const RECENT_LIMIT = 50;

/**
 * Live MCP activity for the current workspace. Uncached — a stale
 * connection log is worse than no log when debugging an integration.
 */
export async function getMcpRequestLogs(): Promise<McpRequestLogDto[]> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    return redirect(getLoginRedirect());
  }

  const organizationId = session.user.organizationId;
  const [recent, apiKeys, grants] = await Promise.all([
    prisma.mcpRequestLog.findMany({
      where: { organizationId },
      select: {
        id: true,
        method: true,
        tool: true,
        status: true,
        durationMs: true,
        apiKeyId: true,
        mcpOAuthGrantId: true,
        errorMessage: true,
        createdAt: true
      },
      orderBy: { createdAt: SortDirection.Desc },
      take: RECENT_LIMIT
    }),
    prisma.apiKey.findMany({
      where: { organizationId },
      select: { id: true, description: true }
    }),
    prisma.mcpOAuthGrant.findMany({
      where: { organizationId },
      select: { id: true, client: { select: { clientName: true } } }
    })
  ]);

  const descriptionById = new Map(
    apiKeys.map((key) => [key.id, key.description])
  );
  const clientNameByGrantId = new Map(
    grants.map((grant) => [grant.id, grant.client.clientName])
  );

  return recent.map((row) => ({
    id: row.id,
    method: row.method,
    tool: row.tool,
    status: row.status,
    durationMs: row.durationMs,
    apiKeyDescription: row.apiKeyId
      ? (descriptionById.get(row.apiKeyId) ?? undefined)
      : undefined,
    clientName: row.mcpOAuthGrantId
      ? (clientNameByGrantId.get(row.mcpOAuthGrantId) ?? undefined)
      : undefined,
    errorMessage: row.errorMessage ?? undefined,
    createdAt: row.createdAt
  }));
}

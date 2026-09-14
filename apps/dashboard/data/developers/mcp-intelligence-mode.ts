import 'server-only';

import { cache } from 'react';

import { dedupedAuth } from '@/lib/auth';
import { checkSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

/**
 * Intelligence layer location for a workspace — read/write via raw SQL so the
 * toggle works even when `prisma generate` cannot refresh the query engine.
 *
 * false = Companion (native in-app assistant runs the intelligence layer)
 * true  = external agents over MCP (Companion hidden, `search_knowledge` on)
 *
 * The two are mutually exclusive: enabling MCP intelligence hides Companion.
 */
export async function readMcpIntelligenceEnabled(
  organizationId: string
): Promise<boolean> {
  try {
    const rows = await prisma.$queryRaw<
      Array<{ mcpIntelligenceEnabled: boolean }>
    >`
      SELECT "mcpIntelligenceEnabled"
      FROM "Organization"
      WHERE id = ${organizationId}::uuid
    `;
    return rows[0]?.mcpIntelligenceEnabled ?? false;
  } catch {
    // Column may not exist until the migration runs — default to Companion.
    return false;
  }
}

export async function writeMcpIntelligenceEnabled(
  organizationId: string,
  enabled: boolean
): Promise<void> {
  await prisma.$executeRaw`
    UPDATE "Organization"
    SET "mcpIntelligenceEnabled" = ${enabled}
    WHERE id = ${organizationId}::uuid
  `;
}

export const getMcpIntelligenceEnabled = cache(async (): Promise<boolean> => {
  const session = await dedupedAuth();
  if (!checkSession(session) || !session.user.organizationId) {
    return false;
  }
  return readMcpIntelligenceEnabled(session.user.organizationId);
});

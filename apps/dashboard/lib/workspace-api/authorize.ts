import 'server-only';

import type { NextRequest } from 'next/server';
import { getPlanCapabilities } from '@humaner/shared/plans';
import type { IndustryType } from '@prisma/client';

import { apiKeyHasScope, type ApiKeyScope } from '@/lib/auth/api-key-scopes';
import { verifyApiKey } from '@/lib/auth/api-keys';
import { prisma } from '@/lib/db/prisma';
import { extractBearerToken } from '@/lib/security/authorize-public-agent-request';
import {
  resolveWorkspaceToolName,
  type WorkspaceToolName
} from '@/lib/workspace-api/catalog';

export type WorkspaceToolContext = {
  organizationId: string;
  /** Null when the caller is a signed-in dashboard session (Companion). */
  apiKeyId: string | null;
  actorUserId: string;
  allowSend: boolean;
};

/** Read-only context for Hybrid RAG over MCP — no actor, no send. */
export type IntelligenceMcpContext = {
  organizationId: string;
  apiKeyId: string | null;
  industry: IndustryType | null;
};

export type IntelligenceMcpAuthSuccess = {
  ok: true;
  allowOrigin: string | null;
  context: IntelligenceMcpContext;
};

export type WorkspaceAuthSuccess = {
  ok: true;
  allowOrigin: string | null;
  context: WorkspaceToolContext;
};

export type WorkspaceAuthFailure = {
  ok: false;
  status: 400 | 401 | 403;
  message: string;
  allowOrigin: string | null;
  organizationId?: string;
  apiKeyId?: string;
};

/** Tasks are inbox work items, so they ride the mailbox scope. */
function scopeForWorkspaceTool(tool: WorkspaceToolName): ApiKeyScope {
  return tool === 'list_calendar_events' || tool === 'create_calendar_event'
    ? 'calendar'
    : 'mailbox';
}

function keyCanUseMcp(scopes: readonly string[]): boolean {
  return (
    apiKeyHasScope(scopes, 'mailbox') ||
    apiKeyHasScope(scopes, 'calendar') ||
    apiKeyHasScope(scopes, 'intelligence')
  );
}

/**
 * Handshake for MCP (initialize, ping, list). Requires a live workspace key
 * with mailbox or calendar access — no anonymous capability probe.
 */
export async function authorizeMcpClient(
  request: NextRequest
): Promise<WorkspaceAuthSuccess | WorkspaceAuthFailure> {
  const allowOrigin = request.headers.get('origin');
  const bearer = extractBearerToken(request);
  if (!bearer) {
    return {
      ok: false,
      status: 401,
      message: 'MCP requires an API key.',
      allowOrigin
    };
  }

  const verified = await verifyApiKey(bearer);
  if (!verified.success) {
    return {
      ok: false,
      status: 401,
      message: 'Invalid API key.',
      allowOrigin
    };
  }

  if (!keyCanUseMcp(verified.scopes)) {
    return {
      ok: false,
      status: 403,
      message:
        'This API key does not have Mailbox, Calendar, or Intelligence access.',
      allowOrigin,
      organizationId: verified.organizationId,
      apiKeyId: verified.id
    };
  }

  const organization = await prisma.organization.findUnique({
    where: { id: verified.organizationId },
    select: {
      id: true,
      ownerId: true,
      tier: true,
      frontierBetaEnabled: true
    }
  });
  if (!organization) {
    return {
      ok: false,
      status: 403,
      message: 'Workspace not found.',
      allowOrigin,
      organizationId: verified.organizationId,
      apiKeyId: verified.id
    };
  }

  const capabilities = getPlanCapabilities(organization.tier, {
    frontierBetaEnabled: organization.frontierBetaEnabled
  });
  if (!capabilities.apiAccess) {
    return {
      ok: false,
      status: 403,
      message: 'API access is not available on this plan.',
      allowOrigin,
      organizationId: organization.id,
      apiKeyId: verified.id
    };
  }

  const actorUserId =
    organization.ownerId ??
    (
      await prisma.organizationMembership.findFirst({
        where: { organizationId: organization.id },
        select: { userId: true },
        orderBy: { createdAt: 'asc' }
      })
    )?.userId;

  if (!actorUserId) {
    return {
      ok: false,
      status: 403,
      message: 'Workspace has no actor to attribute writes to.',
      allowOrigin,
      organizationId: organization.id,
      apiKeyId: verified.id
    };
  }

  return {
    ok: true,
    allowOrigin,
    context: {
      organizationId: organization.id,
      apiKeyId: verified.id,
      actorUserId,
      allowSend: true
    }
  };
}

/**
 * Authorize a Hybrid RAG call over MCP. Requires the `intelligence` scope and
 * returns a read-only org context — retrieval only, no actor or send rights.
 */
export async function authorizeMcpIntelligence(
  request: NextRequest
): Promise<IntelligenceMcpAuthSuccess | WorkspaceAuthFailure> {
  const allowOrigin = request.headers.get('origin');
  const bearer = extractBearerToken(request);
  if (!bearer) {
    return {
      ok: false,
      status: 401,
      message: 'Intelligence tools require an API key.',
      allowOrigin
    };
  }

  const verified = await verifyApiKey(bearer);
  if (!verified.success) {
    return {
      ok: false,
      status: 401,
      message: 'Invalid API key.',
      allowOrigin
    };
  }

  if (!apiKeyHasScope(verified.scopes, 'intelligence')) {
    return {
      ok: false,
      status: 403,
      message: 'This API key does not have Intelligence access.',
      allowOrigin,
      organizationId: verified.organizationId,
      apiKeyId: verified.id
    };
  }

  const organization = await prisma.organization.findUnique({
    where: { id: verified.organizationId },
    select: {
      id: true,
      tier: true,
      frontierBetaEnabled: true,
      industry: true
    }
  });
  if (!organization) {
    return {
      ok: false,
      status: 403,
      message: 'Workspace not found.',
      allowOrigin,
      organizationId: verified.organizationId,
      apiKeyId: verified.id
    };
  }

  const capabilities = getPlanCapabilities(organization.tier, {
    frontierBetaEnabled: organization.frontierBetaEnabled
  });
  if (!capabilities.apiAccess) {
    return {
      ok: false,
      status: 403,
      message: 'API access is not available on this plan.',
      allowOrigin,
      organizationId: organization.id,
      apiKeyId: verified.id
    };
  }

  return {
    ok: true,
    allowOrigin,
    context: {
      organizationId: organization.id,
      apiKeyId: verified.id,
      industry: organization.industry
    }
  };
}

export async function authorizeWorkspaceRequest(input: {
  request: NextRequest;
  tool: string;
}): Promise<WorkspaceAuthSuccess | WorkspaceAuthFailure> {
  const allowOrigin = input.request.headers.get('origin');
  const tool = resolveWorkspaceToolName(input.tool);
  if (!tool) {
    return {
      ok: false,
      status: 400,
      message: 'Unknown workspace tool.',
      allowOrigin
    };
  }

  const bearer = extractBearerToken(input.request);
  if (!bearer) {
    return {
      ok: false,
      status: 401,
      message: 'Mailbox and calendar tools require an API key.',
      allowOrigin
    };
  }

  const verified = await verifyApiKey(bearer);
  if (!verified.success) {
    return {
      ok: false,
      status: 401,
      message: 'Invalid API key.',
      allowOrigin
    };
  }

  const required = scopeForWorkspaceTool(tool);
  if (!apiKeyHasScope(verified.scopes, required)) {
    return {
      ok: false,
      status: 403,
      message:
        required === 'calendar'
          ? 'This API key does not have Calendar access.'
          : 'This API key does not have Mailbox access.',
      allowOrigin,
      organizationId: verified.organizationId,
      apiKeyId: verified.id
    };
  }

  const organization = await prisma.organization.findUnique({
    where: { id: verified.organizationId },
    select: {
      id: true,
      ownerId: true,
      tier: true,
      frontierBetaEnabled: true
    }
  });
  if (!organization) {
    return {
      ok: false,
      status: 403,
      message: 'Workspace not found.',
      allowOrigin,
      organizationId: verified.organizationId,
      apiKeyId: verified.id
    };
  }

  const capabilities = getPlanCapabilities(organization.tier, {
    frontierBetaEnabled: organization.frontierBetaEnabled
  });
  if (!capabilities.apiAccess) {
    return {
      ok: false,
      status: 403,
      message: 'API access is not available on this plan.',
      allowOrigin,
      organizationId: organization.id,
      apiKeyId: verified.id
    };
  }

  const actorUserId =
    organization.ownerId ??
    (
      await prisma.organizationMembership.findFirst({
        where: { organizationId: organization.id },
        select: { userId: true },
        orderBy: { createdAt: 'asc' }
      })
    )?.userId;

  if (!actorUserId) {
    return {
      ok: false,
      status: 403,
      message: 'Workspace has no actor to attribute writes to.',
      allowOrigin,
      organizationId: organization.id,
      apiKeyId: verified.id
    };
  }

  return {
    ok: true,
    allowOrigin,
    context: {
      organizationId: organization.id,
      apiKeyId: verified.id,
      actorUserId,
      allowSend: true
    }
  };
}

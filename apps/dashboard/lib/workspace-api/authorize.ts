import 'server-only';

import type { NextRequest } from 'next/server';
import { getPlanCapabilities } from '@humaner/shared/plans';

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
  apiKeyId: string;
  actorUserId: string;
  allowSend: boolean;
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
};

function scopeForWorkspaceTool(tool: WorkspaceToolName): ApiKeyScope {
  return tool.startsWith('list_calendar') || tool.startsWith('create_calendar')
    ? 'calendar'
    : 'mailbox';
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
      allowOrigin
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
      allowOrigin
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
      allowOrigin
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
      allowOrigin
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

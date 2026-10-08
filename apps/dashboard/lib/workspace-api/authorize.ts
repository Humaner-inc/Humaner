import 'server-only';

import type { NextRequest } from 'next/server';
import { getPlanCapabilities } from '@humaner/shared/plans';
import type { IndustryType } from '@prisma/client';
import { Role } from '@prisma/client';

import {
  apiKeyHasScope,
  apiKeyMissingScopeMessage,
  type ApiKeyScope
} from '@/lib/auth/api-key-scopes';
import { isApiKeyFormat, verifyApiKey } from '@/lib/auth/api-keys';
import { resolveIanaTimeZone } from '@/lib/calendar/parse-calendar-when';
import { prisma } from '@/lib/db/prisma';
import { isOssDeployment } from '@/lib/deployment-mode';
import { isMcpAccessToken } from '@/lib/developers/mcp-oauth';
import { verifyMcpAccessToken } from '@/lib/developers/mcp-oauth-store';
import {
  checkCredentialRateLimit,
  checkIpRateLimit,
  recordFailedAuth
} from '@/lib/security/api-rate-limit';
import { getClientIp } from '@/lib/security/client-ip';
import { extractBearerToken } from '@/lib/security/extract-bearer-token';
import {
  resolveWorkspaceToolName,
  type WorkspaceToolName
} from '@/lib/workspace-api/catalog';

export type WorkspaceToolContext = {
  organizationId: string;
  /** Null for Companion sessions and OAuth grants. */
  apiKeyId: string | null;
  actorUserId: string;
  allowSend: boolean;
  /** IANA timezone for calendar phrases, e.g. Europe/Paris. */
  timeZone?: string;
};

/** Read-only context for MCP knowledge search (FTS) — no actor, no send. */
export type IntelligenceMcpContext = {
  organizationId: string;
  apiKeyId: string | null;
  industry: IndustryType | null;
  tier: string;
};

export type IntelligenceMcpAuthSuccess = {
  ok: true;
  allowOrigin: string | null;
  context: IntelligenceMcpContext;
  oauthGrantId: string | null;
};

export type WorkspaceAuthSuccess = {
  ok: true;
  allowOrigin: string | null;
  context: WorkspaceToolContext;
  scopes: readonly string[];
  oauthGrantId: string | null;
};

export type WorkspaceAuthFailure = {
  ok: false;
  status: 400 | 401 | 403 | 429;
  message: string;
  /** Set with status 429. */
  retryAfterSeconds?: number;
  allowOrigin: string | null;
  organizationId?: string;
  apiKeyId?: string;
  oauthGrantId?: string;
};

type ResolvedMcpCaller = {
  organizationId: string;
  apiKeyId: string | null;
  oauthGrantId: string | null;
  actorUserId: string;
  scopes: readonly string[];
  timeZone?: string;
  industry: IndustryType | null;
  tier: string;
};

const OUTBOUND_TOOLS = new Set<WorkspaceToolName>([
  'add_prospects',
  'list_prospects',
  'update_contact',
  'create_wave',
  'get_wave_review',
  'get_wave_results'
]);

export function isOutboundWorkspaceTool(tool: WorkspaceToolName): boolean {
  return OUTBOUND_TOOLS.has(tool);
}

export async function actorMayUseOutboundTools(
  actorUserId: string
): Promise<boolean> {
  if (isOssDeployment()) {
    return false;
  }
  const actor = await prisma.user.findFirst({
    where: { id: actorUserId },
    select: { role: true }
  });
  return actor?.role === Role.ADMIN;
}

/** Tasks ride mailbox; outbound tools use the outbound scope. */
export function scopeForWorkspaceTool(tool: WorkspaceToolName): ApiKeyScope {
  if (tool === 'list_calendar_events' || tool === 'create_calendar_event') {
    return 'calendar';
  }
  if (OUTBOUND_TOOLS.has(tool)) {
    return 'outbound';
  }
  return 'mailbox';
}

function keyCanUseMcp(scopes: readonly string[]): boolean {
  return (
    apiKeyHasScope(scopes, 'mailbox') ||
    apiKeyHasScope(scopes, 'calendar') ||
    apiKeyHasScope(scopes, 'intelligence') ||
    apiKeyHasScope(scopes, 'outbound')
  );
}

async function resolveWorkspaceActor(
  organizationId: string,
  ownerId: string | null
): Promise<{ actorUserId: string; timeZone?: string } | null> {
  const actorUserId =
    ownerId ??
    (
      await prisma.organizationMembership.findFirst({
        where: { organizationId },
        select: { userId: true },
        orderBy: { createdAt: 'asc' }
      })
    )?.userId;
  if (!actorUserId) {
    return null;
  }
  const actor = await prisma.user.findFirst({
    where: { id: actorUserId },
    select: { timeZone: true }
  });
  const timeZone = resolveIanaTimeZone(actor?.timeZone) ?? undefined;
  return {
    actorUserId,
    ...(timeZone ? { timeZone } : {})
  };
}

async function loadOrganization(organizationId: string) {
  return prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      id: true,
      ownerId: true,
      tier: true,
      frontierBetaEnabled: true,
      industry: true
    }
  });
}

function missingCredential(
  allowOrigin: string | null,
  message = 'MCP requires OAuth or an API key.'
): WorkspaceAuthFailure {
  return {
    ok: false,
    status: 401,
    message,
    allowOrigin
  };
}

async function resolveMcpCredential(
  request: NextRequest
): Promise<
  | { ok: true; allowOrigin: string | null; caller: ResolvedMcpCaller }
  | WorkspaceAuthFailure
> {
  const allowOrigin = request.headers.get('origin');
  const bearer = extractBearerToken(request);
  if (!bearer) {
    return missingCredential(allowOrigin);
  }

  if (isApiKeyFormat(bearer)) {
    const verified = await verifyApiKey(bearer);
    if (!verified.success) {
      return missingCredential(allowOrigin, 'Invalid API key.');
    }
    const organization = await loadOrganization(verified.organizationId);
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
    const actor = await resolveWorkspaceActor(
      organization.id,
      organization.ownerId
    );
    if (!actor) {
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
      caller: {
        organizationId: organization.id,
        apiKeyId: verified.id,
        oauthGrantId: null,
        actorUserId: actor.actorUserId,
        scopes: verified.scopes,
        industry: organization.industry,
        tier: organization.tier,
        ...(actor.timeZone ? { timeZone: actor.timeZone } : {})
      }
    };
  }

  if (!isMcpAccessToken(bearer)) {
    return missingCredential(allowOrigin, 'Invalid MCP credential.');
  }

  const grant = await verifyMcpAccessToken(bearer);
  if (!grant) {
    return missingCredential(allowOrigin, 'Invalid or expired OAuth token.');
  }

  const organization = await loadOrganization(grant.organizationId);
  if (!organization) {
    return {
      ok: false,
      status: 403,
      message: 'Workspace not found.',
      allowOrigin,
      organizationId: grant.organizationId
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
      organizationId: organization.id
    };
  }

  const actor = await prisma.user.findFirst({
    where: { id: grant.userId },
    select: { id: true, timeZone: true }
  });
  const membership = actor
    ? await prisma.organizationMembership.findUnique({
        where: {
          userId_organizationId: {
            userId: actor.id,
            organizationId: organization.id
          }
        },
        select: { id: true }
      })
    : null;
  const stillMember =
    actor != null && (membership != null || organization.ownerId === actor.id);
  if (!stillMember || !actor) {
    return {
      ok: false,
      status: 403,
      message: 'This account is no longer a member of the workspace.',
      allowOrigin,
      organizationId: organization.id
    };
  }
  const timeZone = resolveIanaTimeZone(actor.timeZone) ?? undefined;

  return {
    ok: true,
    allowOrigin,
    caller: {
      organizationId: organization.id,
      apiKeyId: null,
      oauthGrantId: grant.grantId,
      actorUserId: actor.id,
      scopes: grant.scopes,
      industry: organization.industry,
      tier: organization.tier,
      ...(timeZone ? { timeZone } : {})
    }
  };
}

function tooManyRequests(
  allowOrigin: string | null,
  retryAfterSeconds: number,
  extra: Partial<WorkspaceAuthFailure> = {}
): WorkspaceAuthFailure {
  return {
    ok: false,
    status: 429,
    message: 'Too many requests. Slow down and retry shortly.',
    allowOrigin,
    retryAfterSeconds,
    ...extra
  };
}

/**
 * Rate-limited credential resolution shared by MCP and REST: per-address cap,
 * a cap on rejected credentials, then a per-key / per-grant cap once verified.
 */
async function resolveMcpCaller(
  request: NextRequest
): Promise<
  | { ok: true; allowOrigin: string | null; caller: ResolvedMcpCaller }
  | WorkspaceAuthFailure
> {
  const allowOrigin = request.headers.get('origin');
  const ip = getClientIp(request);

  const ipCheck = await checkIpRateLimit(ip);
  if (ipCheck.limited) {
    return tooManyRequests(allowOrigin, ipCheck.retryAfterSeconds);
  }

  const resolved = await resolveMcpCredential(request);
  if (!resolved.ok) {
    if (resolved.status === 401 && extractBearerToken(request)) {
      const failed = await recordFailedAuth(ip);
      if (failed.limited) {
        return tooManyRequests(allowOrigin, failed.retryAfterSeconds);
      }
    }
    return resolved;
  }

  const credentialId = resolved.caller.apiKeyId ?? resolved.caller.oauthGrantId;
  if (credentialId) {
    const credentialCheck = await checkCredentialRateLimit(credentialId);
    if (credentialCheck.limited) {
      return tooManyRequests(allowOrigin, credentialCheck.retryAfterSeconds, {
        organizationId: resolved.caller.organizationId,
        apiKeyId: resolved.caller.apiKeyId ?? undefined,
        oauthGrantId: resolved.caller.oauthGrantId ?? undefined
      });
    }
  }

  return resolved;
}

/**
 * Handshake for MCP (initialize, ping, list). Requires OAuth or a live
 * workspace key with mailbox, calendar, or intelligence access.
 */
export async function authorizeMcpClient(
  request: NextRequest
): Promise<WorkspaceAuthSuccess | WorkspaceAuthFailure> {
  const resolved = await resolveMcpCaller(request);
  if (!resolved.ok) {
    return resolved;
  }
  if (!keyCanUseMcp(resolved.caller.scopes)) {
    return {
      ok: false,
      status: 403,
      message:
        'This credential does not have Mailbox, Calendar, or Intelligence access.',
      allowOrigin: resolved.allowOrigin,
      organizationId: resolved.caller.organizationId,
      apiKeyId: resolved.caller.apiKeyId ?? undefined,
      oauthGrantId: resolved.caller.oauthGrantId ?? undefined
    };
  }
  return {
    ok: true,
    allowOrigin: resolved.allowOrigin,
    context: {
      organizationId: resolved.caller.organizationId,
      apiKeyId: resolved.caller.apiKeyId,
      actorUserId: resolved.caller.actorUserId,
      allowSend: true,
      ...(resolved.caller.timeZone
        ? { timeZone: resolved.caller.timeZone }
        : {})
    },
    scopes: resolved.caller.scopes,
    oauthGrantId: resolved.caller.oauthGrantId
  };
}

/**
 * Authorize a knowledge-search call over MCP. Requires the `intelligence` scope
 * and returns a read-only org context — FTS only, no actor or send rights.
 */
export async function authorizeMcpIntelligence(
  request: NextRequest
): Promise<IntelligenceMcpAuthSuccess | WorkspaceAuthFailure> {
  const resolved = await resolveMcpCaller(request);
  if (!resolved.ok) {
    if (resolved.status === 401) {
      return {
        ...resolved,
        message: 'Intelligence tools require OAuth or an API key.'
      };
    }
    return resolved;
  }
  if (!apiKeyHasScope(resolved.caller.scopes, 'intelligence')) {
    return {
      ok: false,
      status: 403,
      message: 'This credential does not have Intelligence access.',
      allowOrigin: resolved.allowOrigin,
      organizationId: resolved.caller.organizationId,
      apiKeyId: resolved.caller.apiKeyId ?? undefined,
      oauthGrantId: resolved.caller.oauthGrantId ?? undefined
    };
  }
  return {
    ok: true,
    allowOrigin: resolved.allowOrigin,
    context: {
      organizationId: resolved.caller.organizationId,
      apiKeyId: resolved.caller.apiKeyId,
      industry: resolved.caller.industry,
      tier: resolved.caller.tier
    },
    oauthGrantId: resolved.caller.oauthGrantId
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

  const resolved = await resolveMcpCaller(input.request);
  if (!resolved.ok) {
    if (resolved.status === 401) {
      return {
        ...resolved,
        message: 'Mailbox and calendar tools require OAuth or an API key.'
      };
    }
    return resolved;
  }

  const required = scopeForWorkspaceTool(tool);
  if (!apiKeyHasScope(resolved.caller.scopes, required)) {
    return {
      ok: false,
      status: 403,
      message: apiKeyMissingScopeMessage(required),
      allowOrigin: resolved.allowOrigin,
      organizationId: resolved.caller.organizationId,
      apiKeyId: resolved.caller.apiKeyId ?? undefined,
      oauthGrantId: resolved.caller.oauthGrantId ?? undefined
    };
  }

  // Cloud Role.ADMIN preview — not Self-Host, not workspace owner
  if (OUTBOUND_TOOLS.has(tool)) {
    if (isOssDeployment()) {
      return {
        ok: false,
        status: 403,
        message: 'Outbound is Cloud-only.',
        allowOrigin: resolved.allowOrigin,
        organizationId: resolved.caller.organizationId,
        apiKeyId: resolved.caller.apiKeyId ?? undefined,
        oauthGrantId: resolved.caller.oauthGrantId ?? undefined
      };
    }
    const actor = await prisma.user.findFirst({
      where: { id: resolved.caller.actorUserId },
      select: { role: true }
    });
    if (actor?.role !== Role.ADMIN) {
      return {
        ok: false,
        status: 403,
        message: 'Outbound is limited to platform admins.',
        allowOrigin: resolved.allowOrigin,
        organizationId: resolved.caller.organizationId,
        apiKeyId: resolved.caller.apiKeyId ?? undefined,
        oauthGrantId: resolved.caller.oauthGrantId ?? undefined
      };
    }
  }

  return {
    ok: true,
    allowOrigin: resolved.allowOrigin,
    context: {
      organizationId: resolved.caller.organizationId,
      apiKeyId: resolved.caller.apiKeyId,
      actorUserId: resolved.caller.actorUserId,
      allowSend: true,
      ...(resolved.caller.timeZone
        ? { timeZone: resolved.caller.timeZone }
        : {})
    },
    scopes: resolved.caller.scopes,
    oauthGrantId: resolved.caller.oauthGrantId
  };
}

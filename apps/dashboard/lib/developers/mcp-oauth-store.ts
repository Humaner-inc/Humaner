import 'server-only';

import { randomUUID } from 'crypto';
import { addSeconds, isAfter } from 'date-fns';

import type { ApiKeyScope } from '@/lib/auth/api-key-scopes';
import { prisma } from '@/lib/db/prisma';
import {
  generateMcpOAuthSecret,
  hashMcpOAuthSecret,
  MCP_ACCESS_TOKEN_PREFIX,
  MCP_ACCESS_TOKEN_TTL_SECONDS,
  MCP_AUTH_CODE_TTL_MS,
  MCP_REFRESH_TOKEN_PREFIX,
  MCP_REFRESH_TOKEN_TTL_SECONDS,
  pkceChallengeS256
} from '@/lib/developers/mcp-oauth';

export async function registerMcpOAuthClient(input: {
  clientName: string;
  redirectUris: string[];
}): Promise<{ clientId: string; clientName: string; redirectUris: string[] }> {
  const clientId = randomUUID();
  const created = await prisma.mcpOAuthClient.create({
    data: {
      clientId,
      clientName: input.clientName.slice(0, 255) || 'MCP client',
      redirectUris: input.redirectUris,
      tokenEndpointAuthMethod: 'none'
    },
    select: {
      clientId: true,
      clientName: true,
      redirectUris: true
    }
  });
  return created;
}

export async function findMcpOAuthClient(clientId: string) {
  return prisma.mcpOAuthClient.findUnique({
    where: { clientId },
    select: {
      clientId: true,
      clientName: true,
      redirectUris: true
    }
  });
}

export async function createMcpAuthorizationCode(input: {
  clientId: string;
  userId: string;
  organizationId: string;
  scopes: ApiKeyScope[];
  redirectUri: string;
  codeChallenge: string;
}): Promise<string> {
  const code = generateMcpOAuthSecret('mcp_code_');
  await prisma.mcpOAuthGrant.create({
    data: {
      clientId: input.clientId,
      userId: input.userId,
      organizationId: input.organizationId,
      scopes: input.scopes,
      redirectUri: input.redirectUri,
      codeHash: hashMcpOAuthSecret(code),
      codeChallenge: input.codeChallenge,
      codeExpiresAt: new Date(Date.now() + MCP_AUTH_CODE_TTL_MS)
    }
  });
  return code;
}

export async function exchangeMcpAuthorizationCode(input: {
  code: string;
  clientId: string;
  redirectUri: string;
  codeVerifier: string;
}): Promise<
  | { ok: true; accessToken: string; refreshToken: string; scopes: string[] }
  | { ok: false; message: string }
> {
  const grant = await prisma.mcpOAuthGrant.findUnique({
    where: { codeHash: hashMcpOAuthSecret(input.code) }
  });
  if (
    !grant ||
    grant.revokedAt ||
    grant.clientId !== input.clientId ||
    grant.redirectUri !== input.redirectUri ||
    !grant.codeExpiresAt ||
    isAfter(new Date(), grant.codeExpiresAt) ||
    !grant.codeChallenge
  ) {
    return { ok: false, message: 'Invalid authorization code.' };
  }
  if (pkceChallengeS256(input.codeVerifier) !== grant.codeChallenge) {
    return { ok: false, message: 'Invalid PKCE verifier.' };
  }

  const tokens = await issueMcpTokens(grant.id, grant.scopes);
  return { ok: true, ...tokens, scopes: grant.scopes };
}

export async function refreshMcpAccessToken(input: {
  refreshToken: string;
  clientId: string;
}): Promise<
  | { ok: true; accessToken: string; refreshToken: string; scopes: string[] }
  | { ok: false; message: string }
> {
  const grant = await prisma.mcpOAuthGrant.findUnique({
    where: { refreshTokenHash: hashMcpOAuthSecret(input.refreshToken) }
  });
  if (
    !grant ||
    grant.revokedAt ||
    grant.clientId !== input.clientId ||
    !grant.refreshExpiresAt ||
    isAfter(new Date(), grant.refreshExpiresAt)
  ) {
    return { ok: false, message: 'Invalid refresh token.' };
  }

  const tokens = await issueMcpTokens(grant.id, grant.scopes);
  return { ok: true, ...tokens, scopes: grant.scopes };
}

async function issueMcpTokens(
  grantId: string,
  scopes: string[]
): Promise<{ accessToken: string; refreshToken: string }> {
  const accessToken = generateMcpOAuthSecret(MCP_ACCESS_TOKEN_PREFIX);
  const refreshToken = generateMcpOAuthSecret(MCP_REFRESH_TOKEN_PREFIX);
  const now = new Date();
  await prisma.mcpOAuthGrant.update({
    where: { id: grantId },
    data: {
      codeHash: null,
      codeChallenge: null,
      codeExpiresAt: null,
      accessTokenHash: hashMcpOAuthSecret(accessToken),
      refreshTokenHash: hashMcpOAuthSecret(refreshToken),
      accessExpiresAt: addSeconds(now, MCP_ACCESS_TOKEN_TTL_SECONDS),
      refreshExpiresAt: addSeconds(now, MCP_REFRESH_TOKEN_TTL_SECONDS),
      lastUsedAt: now
    },
    select: { id: true }
  });
  void scopes;
  return { accessToken, refreshToken };
}

export async function verifyMcpAccessToken(token: string): Promise<{
  organizationId: string;
  userId: string;
  scopes: string[];
  grantId: string;
} | null> {
  const grant = await prisma.mcpOAuthGrant.findUnique({
    where: { accessTokenHash: hashMcpOAuthSecret(token) },
    select: {
      id: true,
      organizationId: true,
      userId: true,
      scopes: true,
      revokedAt: true,
      accessExpiresAt: true
    }
  });
  if (
    !grant ||
    grant.revokedAt ||
    !grant.accessExpiresAt ||
    isAfter(new Date(), grant.accessExpiresAt)
  ) {
    return null;
  }
  await prisma.mcpOAuthGrant.update({
    where: { id: grant.id },
    data: { lastUsedAt: new Date() },
    select: { id: true }
  });
  return {
    organizationId: grant.organizationId,
    userId: grant.userId,
    scopes: grant.scopes,
    grantId: grant.id
  };
}

export async function revokeMcpOAuthGrant(input: {
  id: string;
  organizationId: string;
}): Promise<boolean> {
  const existing = await prisma.mcpOAuthGrant.findFirst({
    where: { id: input.id, organizationId: input.organizationId },
    select: { id: true }
  });
  if (!existing) {
    return false;
  }
  await prisma.mcpOAuthGrant.update({
    where: { id: existing.id },
    data: {
      revokedAt: new Date(),
      accessTokenHash: null,
      refreshTokenHash: null,
      codeHash: null
    },
    select: { id: true }
  });
  return true;
}

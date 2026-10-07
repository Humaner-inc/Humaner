import { createHash, randomBytes } from 'crypto';

import { Routes } from '@/constants/routes';
import {
  API_KEY_SCOPES,
  PLATFORM_ADMIN_API_KEY_SCOPES,
  type ApiKeyScope
} from '@/lib/auth/api-key-scopes';
import { mcpPublicEndpoint, mcpServerIconUrl } from '@/lib/developers/mcp-http';

// Interactive OAuth (Cursor, Claude) never grants Cloud Role.ADMIN preview scopes
export const MCP_OAUTH_SCOPES = API_KEY_SCOPES.filter(
  (scope) => !PLATFORM_ADMIN_API_KEY_SCOPES.has(scope)
);
export const MCP_OAUTH_DEFAULT_SCOPES: ApiKeyScope[] = ['mailbox', 'calendar'];

export const MCP_ACCESS_TOKEN_PREFIX = 'mcp_at_';
export const MCP_REFRESH_TOKEN_PREFIX = 'mcp_rt_';

export const MCP_ACCESS_TOKEN_TTL_SECONDS = 60 * 60;
export const MCP_REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30;
export const MCP_AUTH_CODE_TTL_MS = 10 * 60 * 1000;

const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '[::1]', '::1']);
const APP_SCHEMES = new Set(['cursor:', 'vscode:', 'vscode-insiders:']);

export function hashMcpOAuthSecret(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function generateMcpOAuthSecret(prefix: string): string {
  return `${prefix}${randomBytes(24).toString('hex')}`;
}

export function isMcpAccessToken(token: string): boolean {
  return token.startsWith(MCP_ACCESS_TOKEN_PREFIX);
}

export function pkceChallengeS256(verifier: string): string {
  return createHash('sha256').update(verifier).digest('base64url');
}

export function parseMcpOAuthScopes(value: unknown): ApiKeyScope[] {
  const raw =
    typeof value === 'string'
      ? value.split(/[\s,]+/)
      : Array.isArray(value)
        ? value.filter((item): item is string => typeof item === 'string')
        : [];
  const allowed = new Set<ApiKeyScope>(MCP_OAUTH_SCOPES);
  const scopes = raw
    .map((item) => item.trim())
    .filter((item): item is ApiKeyScope => allowed.has(item as ApiKeyScope));
  return scopes.length > 0
    ? [...new Set(scopes)]
    : [...MCP_OAUTH_DEFAULT_SCOPES];
}

export function mcpIssuer(appUrl: string): string {
  return mcpPublicEndpoint(appUrl).replace(/\/api\/mcp$/, '');
}

export function mcpProtectedResourceMetadataUrl(appUrl: string): string {
  return `${mcpIssuer(appUrl)}/.well-known/oauth-protected-resource/api/mcp`;
}

export function mcpAuthorizationServerMetadataUrl(appUrl: string): string {
  return `${mcpIssuer(appUrl)}/.well-known/oauth-authorization-server`;
}

export function mcpWwwAuthenticate(appUrl: string): string {
  const metadata = mcpProtectedResourceMetadataUrl(appUrl);
  return `Bearer realm="Humaner", resource_metadata="${metadata}", scope="${MCP_OAUTH_DEFAULT_SCOPES.join(' ')}"`;
}

export function mcpOAuthCorsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers':
      'Accept, Authorization, Content-Type, MCP-Protocol-Version',
    'Access-Control-Max-Age': '86400'
  };
}

export function mcpProtectedResourceMetadata(
  appUrl: string
): Record<string, unknown> {
  const issuer = mcpIssuer(appUrl);
  return {
    resource: mcpPublicEndpoint(appUrl),
    authorization_servers: [issuer],
    bearer_methods_supported: ['header'],
    scopes_supported: [...MCP_OAUTH_SCOPES],
    logo_uri: mcpServerIconUrl(appUrl)
  };
}

export function mcpAuthorizationServerMetadata(
  appUrl: string
): Record<string, unknown> {
  const issuer = mcpIssuer(appUrl);
  return {
    issuer,
    authorization_endpoint: `${issuer}${Routes.McpOAuthAuthorize}`,
    token_endpoint: `${issuer}/api/oauth/mcp/token`,
    registration_endpoint: `${issuer}/api/oauth/mcp/register`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    code_challenge_methods_supported: ['S256'],
    token_endpoint_auth_methods_supported: ['none'],
    scopes_supported: [...MCP_OAUTH_SCOPES],
    resource_indicators_supported: true,
    logo_uri: mcpServerIconUrl(appUrl)
  };
}

export function isAllowedMcpRedirectUri(value: string): boolean {
  try {
    const url = new URL(value);
    if (APP_SCHEMES.has(`${url.protocol}`)) {
      return true;
    }
    if (url.protocol === 'https:') {
      return Boolean(url.hostname);
    }
    if (url.protocol === 'http:' && LOOPBACK_HOSTS.has(url.hostname)) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function redirectUriMatches(
  registered: readonly string[],
  requested: string
): boolean {
  if (registered.includes(requested)) {
    return true;
  }
  let requestedUrl: URL;
  try {
    requestedUrl = new URL(requested);
  } catch {
    return false;
  }
  if (
    requestedUrl.protocol !== 'http:' ||
    !LOOPBACK_HOSTS.has(requestedUrl.hostname)
  ) {
    return false;
  }
  return registered.some((entry) => {
    try {
      const allowed = new URL(entry);
      return (
        allowed.protocol === 'http:' &&
        LOOPBACK_HOSTS.has(allowed.hostname) &&
        allowed.pathname === requestedUrl.pathname
      );
    } catch {
      return false;
    }
  });
}

export function mcpConsentUrl(params: URLSearchParams): string {
  return `${Routes.McpOAuthConsent}?${params.toString()}`;
}

export function mcpAppUrlFromRequest(request: Request): string {
  const url = new URL(request.url);
  const forwardedHost = request.headers
    .get('x-forwarded-host')
    ?.split(',')[0]
    ?.trim();
  const forwardedProto = request.headers
    .get('x-forwarded-proto')
    ?.split(',')[0]
    ?.trim();
  const host = forwardedHost || url.host;
  const isLoopback =
    host.startsWith('localhost') ||
    host.startsWith('127.0.0.1') ||
    host.startsWith('[::1]');
  const proto = forwardedProto || url.protocol.replace(':', '');
  const scheme = isLoopback ? proto || 'http' : 'https';
  return `${scheme}://${host}`;
}

import { describe, expect, it } from 'vitest';

import { MCP_SERVER_ICON_VERSION } from '@/lib/developers/mcp-http';
import {
  isAllowedMcpRedirectUri,
  mcpAuthorizationServerMetadata,
  mcpProtectedResourceMetadata,
  mcpWwwAuthenticate,
  parseMcpOAuthScopes,
  pkceChallengeS256,
  redirectUriMatches
} from '@/lib/developers/mcp-oauth';

describe('mcp oauth metadata', () => {
  it('points authorization at Humaner and the MCP resource', () => {
    const resource = mcpProtectedResourceMetadata('https://app.humaner.io');
    const server = mcpAuthorizationServerMetadata('https://app.humaner.io');
    expect(resource.resource).toBe('https://app.humaner.io/api/mcp');
    expect(resource.authorization_servers).toEqual(['https://app.humaner.io']);
    expect(server.authorization_endpoint).toBe(
      'https://app.humaner.io/api/oauth/mcp/authorize'
    );
    expect(mcpWwwAuthenticate('https://app.humaner.io')).toContain(
      'resource_metadata="https://app.humaner.io/.well-known/oauth-protected-resource/api/mcp"'
    );
    expect(resource.logo_uri).toBe(
      `https://app.humaner.io/brandmark_blue.svg?v=${MCP_SERVER_ICON_VERSION}`
    );
    expect(server.logo_uri).toBe(
      `https://app.humaner.io/brandmark_blue.svg?v=${MCP_SERVER_ICON_VERSION}`
    );
  });
});

describe('mcp oauth redirect URIs', () => {
  it('allows loopback, https, and editor schemes', () => {
    expect(isAllowedMcpRedirectUri('http://127.0.0.1:8732/callback')).toBe(
      true
    );
    expect(
      isAllowedMcpRedirectUri('cursor://anysphere.cursor-mcp/oauth/callback')
    ).toBe(true);
    expect(isAllowedMcpRedirectUri('https://evil.example/steal')).toBe(true);
    expect(isAllowedMcpRedirectUri('http://evil.example/steal')).toBe(false);
  });

  it('matches loopback across ports', () => {
    expect(
      redirectUriMatches(
        ['http://127.0.0.1/callback'],
        'http://127.0.0.1:48291/callback'
      )
    ).toBe(true);
  });
});

describe('mcp oauth scopes and pkce', () => {
  it('defaults to mailbox and calendar', () => {
    expect(parseMcpOAuthScopes('')).toEqual(['mailbox', 'calendar']);
    expect(parseMcpOAuthScopes('mailbox intelligence')).toEqual([
      'mailbox',
      'intelligence'
    ]);
  });

  it('does not advertise or grant Cloud preview outbound over OAuth', () => {
    const resource = mcpProtectedResourceMetadata('https://app.humaner.io');
    const server = mcpAuthorizationServerMetadata('https://app.humaner.io');
    expect(resource.scopes_supported).not.toContain('outbound');
    expect(server.scopes_supported).not.toContain('outbound');
    expect(parseMcpOAuthScopes('mailbox outbound')).toEqual(['mailbox']);
  });

  it('verifies S256 challenges', () => {
    expect(pkceChallengeS256('verifier')).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});

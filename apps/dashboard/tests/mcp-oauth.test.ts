import { describe, expect, it } from 'vitest';

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

  it('verifies S256 challenges', () => {
    expect(pkceChallengeS256('verifier')).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});

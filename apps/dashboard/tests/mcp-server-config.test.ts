import { describe, expect, it } from 'vitest';

import {
  isMcpRequestEncrypted,
  MCP_SERVER_ICON_VERSION,
  mcpPublicEndpoint,
  mcpServerIcons,
  negotiateMcpProtocolVersion
} from '@/lib/developers/mcp-http';
import {
  buildMcpApiKeyServerConfig,
  buildMcpServerConfig
} from '@/lib/developers/mcp-server-config';

describe('buildMcpServerConfig', () => {
  it('uses a remote URL like Neon, not a stdio command', () => {
    const parsed = JSON.parse(
      buildMcpServerConfig('https://app.humaner.io')
    ) as {
      mcpServers: {
        humaner: {
          url?: string;
          command?: string;
          headers?: { Authorization: string };
        };
      };
    };
    expect(parsed.mcpServers.humaner.url).toBe(
      'https://app.humaner.io/api/mcp'
    );
    expect(parsed.mcpServers.humaner.command).toBeUndefined();
    expect(parsed.mcpServers.humaner.headers).toBeUndefined();
  });

  it('keeps a Bearer snippet for scripts', () => {
    const parsed = JSON.parse(
      buildMcpApiKeyServerConfig('https://app.humaner.io')
    ) as {
      mcpServers: { humaner: { headers?: { Authorization: string } } };
    };
    expect(parsed.mcpServers.humaner.headers?.Authorization).toBe(
      'Bearer Your_api_key'
    );
  });
});

describe('mcpServerIcons', () => {
  it('advertises landing LOGO.png with pixel sizes Cursor accepts', () => {
    expect(mcpServerIcons('https://app.humaner.io')).toEqual([
      {
        src: `https://app.humaner.io/LOGO.png?v=${MCP_SERVER_ICON_VERSION}`,
        mimeType: 'image/png',
        sizes: ['512x512', '256x256', '128x128']
      },
      {
        src: `https://app.humaner.io/icon.png?v=${MCP_SERVER_ICON_VERSION}`,
        mimeType: 'image/png',
        sizes: ['256x256']
      }
    ]);
  });
});

describe('negotiateMcpProtocolVersion', () => {
  it('echoes a supported client version', () => {
    expect(negotiateMcpProtocolVersion('2024-11-05')).toBe('2024-11-05');
    expect(negotiateMcpProtocolVersion('2025-03-26')).toBe('2025-03-26');
  });

  it('falls back when the client version is unknown', () => {
    expect(negotiateMcpProtocolVersion('1999-01-01')).toBe('2025-03-26');
  });
});

describe('mcpPublicEndpoint', () => {
  it('upgrades non-loopback http to https', () => {
    expect(mcpPublicEndpoint('http://app.humaner.io')).toBe(
      'https://app.humaner.io/api/mcp'
    );
  });

  it('keeps loopback http for local Cursor', () => {
    expect(mcpPublicEndpoint('http://localhost:3001')).toBe(
      'http://localhost:3001/api/mcp'
    );
  });
});

describe('isMcpRequestEncrypted', () => {
  it('allows loopback http', () => {
    const request = new Request('http://localhost:3001/api/mcp');
    expect(isMcpRequestEncrypted(request)).toBe(true);
  });

  it('rejects cleartext on a public host', () => {
    const request = new Request('http://app.humaner.io/api/mcp', {
      headers: { 'x-forwarded-proto': 'http' }
    });
    expect(isMcpRequestEncrypted(request)).toBe(false);
  });

  it('accepts https via forwarded proto', () => {
    const request = new Request('http://app.humaner.io/api/mcp', {
      headers: { 'x-forwarded-proto': 'https' }
    });
    expect(isMcpRequestEncrypted(request)).toBe(true);
  });
});

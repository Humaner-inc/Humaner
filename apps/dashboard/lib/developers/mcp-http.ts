const SUPPORTED_PROTOCOL_VERSIONS = ['2025-03-26', '2024-11-05'] as const;

function isLoopbackHost(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname === '[::1]'
  );
}

/** Production MCP is HTTPS only. Loopback HTTP is allowed for local Cursor. */
export function isMcpRequestEncrypted(request: Request): boolean {
  const url = new URL(request.url);
  if (isLoopbackHost(url.hostname)) {
    return true;
  }
  const forwarded = request.headers
    .get('x-forwarded-proto')
    ?.split(',')[0]
    ?.trim()
    .toLowerCase();
  const proto = forwarded || url.protocol.replace(/:$/, '');
  return proto === 'https';
}

export const MCP_SERVER_ICON_PATH = '/LOGO.png';

export const MCP_SERVER_ICON_VERSION = '20260920e';

export const MCP_SERVER_INFO_VERSION = '1.0.1';

export function mcpServerOrigin(appUrl: string): string {
  return mcpPublicEndpoint(appUrl).replace(/\/api\/mcp$/, '');
}

export function mcpServerIconUrl(appUrl: string): string {
  return `${mcpServerOrigin(appUrl)}${MCP_SERVER_ICON_PATH}?v=${MCP_SERVER_ICON_VERSION}`;
}

export function mcpServerIcons(appUrl: string): Array<{
  src: string;
  mimeType: string;
  sizes: string[];
}> {
  const origin = mcpServerOrigin(appUrl);
  const logo = mcpServerIconUrl(appUrl);
  return [
    {
      src: logo,
      mimeType: 'image/png',
      sizes: ['512x512', '256x256', '128x128']
    },
    {
      src: `${origin}/icon.png?v=${MCP_SERVER_ICON_VERSION}`,
      mimeType: 'image/png',
      sizes: ['256x256']
    }
  ];
}

/** Snippet URL: always https except loopback. */
export function mcpPublicEndpoint(appUrl: string): string {
  const raw = appUrl.trim().replace(/\/$/, '');
  const withProto = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  const url = new URL(withProto);
  if (!isLoopbackHost(url.hostname)) {
    url.protocol = 'https:';
  }
  url.pathname = '/api/mcp';
  url.search = '';
  url.hash = '';
  return url.toString().replace(/\/$/, '');
}

export function negotiateMcpProtocolVersion(requested: unknown): string {
  if (
    typeof requested === 'string' &&
    SUPPORTED_PROTOCOL_VERSIONS.includes(
      requested as (typeof SUPPORTED_PROTOCOL_VERSIONS)[number]
    )
  ) {
    return requested;
  }
  return '2025-03-26';
}

export function mcpCorsHeaders(
  allowOrigin: string | null
): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers':
      'Accept, Authorization, Content-Type, Last-Event-ID, MCP-Protocol-Version, Mcp-Session-Id',
    'Access-Control-Expose-Headers': 'MCP-Protocol-Version, Mcp-Session-Id',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin'
  };
  if (allowOrigin) {
    headers['Access-Control-Allow-Origin'] = allowOrigin;
  }
  return headers;
}

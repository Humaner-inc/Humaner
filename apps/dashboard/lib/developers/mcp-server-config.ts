import { API_KEY_SNIPPET_PLACEHOLDER } from '@/lib/auth/api-key-constants';
import { mcpPublicEndpoint } from '@/lib/developers/mcp-http';

/**
 * Cursor / Claude / VS Code — URL only. The client opens Humaner OAuth once.
 */
export function buildMcpServerConfig(appUrl: string): string {
  return JSON.stringify(
    {
      mcpServers: {
        humaner: {
          url: mcpPublicEndpoint(appUrl)
        }
      }
    },
    null,
    2
  );
}

/** Scripts and CI — same server, scoped `hu_` key instead of the browser login. */
export function buildMcpApiKeyServerConfig(appUrl: string): string {
  return JSON.stringify(
    {
      mcpServers: {
        humaner: {
          url: mcpPublicEndpoint(appUrl),
          headers: {
            Authorization: `Bearer ${API_KEY_SNIPPET_PLACEHOLDER}`
          }
        }
      }
    },
    null,
    2
  );
}

import { API_KEY_SNIPPET_PLACEHOLDER } from '@/lib/auth/api-key-constants';
import { mcpPublicEndpoint } from '@/lib/developers/mcp-http';

/**
 * Cursor remote MCP — same shape as Neon (`url`, not stdio / mcp-remote).
 * Paste a workspace API key; Cursor sends it on every request over HTTPS.
 */
export function buildMcpServerConfig(appUrl: string): string {
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

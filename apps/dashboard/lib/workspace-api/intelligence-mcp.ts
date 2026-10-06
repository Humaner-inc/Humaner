import 'server-only';

export const MCP_INTELLIGENCE_TOOL_NAMES = ['search_knowledge'] as const;

export type McpIntelligenceToolName =
  (typeof MCP_INTELLIGENCE_TOOL_NAMES)[number];

export function resolveMcpIntelligenceToolName(
  value: string
): McpIntelligenceToolName | null {
  if (MCP_INTELLIGENCE_TOOL_NAMES.includes(value as McpIntelligenceToolName)) {
    return value as McpIntelligenceToolName;
  }
  return null;
}

export const MCP_INTELLIGENCE_TOOLS = [] as const;

export type McpIntelligenceContext = {
  organizationId: string;
  industry: string | null;
  tier: string;
};

export type McpIntelligenceResult = {
  ok: boolean;
  data?: unknown;
  error?: string;
};

export async function executeMcpIntelligenceTool(
  _name: string,
  _args: Record<string, unknown>,
  _context: McpIntelligenceContext
): Promise<McpIntelligenceResult> {
  return {
    ok: false,
    error: 'Knowledge search is not available on Self-Host.'
  };
}

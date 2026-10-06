import { NextResponse, type NextRequest } from 'next/server';

import { readMcpIntelligenceEnabled } from '@/data/developers/mcp-intelligence-mode';
import { readCompanionWorkspaceRights } from '@/data/inbox/companion-rights';
import { apiKeyHasScope } from '@/lib/auth/api-key-scopes';
import { isOssDeployment } from '@/lib/deployment-mode';
import {
  logMcpRequest,
  type McpLogActor
} from '@/lib/developers/log-mcp-request';
import {
  isMcpRequestEncrypted,
  MCP_SERVER_INFO_VERSION,
  mcpCorsHeaders,
  mcpServerIcons,
  negotiateMcpProtocolVersion
} from '@/lib/developers/mcp-http';
import {
  mcpAppUrlFromRequest,
  mcpWwwAuthenticate
} from '@/lib/developers/mcp-oauth';
import { integrationForConnectorTool } from '@/lib/inbox/companion-rights';
import { workspaceToolAllowedOnDeployment } from '@/lib/oss-surface';
import {
  authorizeMcpClient,
  authorizeMcpIntelligence,
  authorizeWorkspaceRequest,
  scopeForWorkspaceTool,
  type IntelligenceMcpAuthSuccess,
  type WorkspaceAuthFailure,
  type WorkspaceAuthSuccess
} from '@/lib/workspace-api/authorize';
import { WORKSPACE_TOOLS } from '@/lib/workspace-api/catalog';
import { executeWorkspaceTool } from '@/lib/workspace-api/execute-tools';
import {
  executeMcpIntelligenceTool,
  MCP_INTELLIGENCE_TOOLS,
  resolveMcpIntelligenceToolName
} from '@/lib/workspace-api/intelligence-mcp';

type JsonRpcRequest = {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
};

function rpcResult(
  id: string | number | null | undefined,
  result: unknown,
  origin: string | null
): NextResponse {
  return NextResponse.json(
    { jsonrpc: '2.0', id: id ?? null, result },
    { headers: mcpCorsHeaders(origin) }
  );
}

function rpcError(
  id: string | number | null | undefined,
  code: number,
  message: string,
  origin: string | null,
  status = 200,
  extraHeaders?: Record<string, string>
): NextResponse {
  return NextResponse.json(
    { jsonrpc: '2.0', id: id ?? null, error: { code, message } },
    {
      status,
      headers: { ...mcpCorsHeaders(origin), ...extraHeaders }
    }
  );
}

function mcpUnauthorized(
  request: NextRequest,
  id: string | number | null | undefined,
  message: string,
  origin: string | null
): NextResponse {
  return rpcError(id, -32001, message, origin, 401, {
    'WWW-Authenticate': mcpWwwAuthenticate(mcpAppUrlFromRequest(request))
  });
}

function accepted(origin: string | null): Response {
  return new Response(null, {
    status: 202,
    headers: mcpCorsHeaders(origin)
  });
}

function requireHttps(request: NextRequest): Response | null {
  if (isMcpRequestEncrypted(request)) {
    return null;
  }
  return NextResponse.json(
    { error: 'MCP requires HTTPS.' },
    {
      status: 426,
      headers: {
        ...mcpCorsHeaders(request.headers.get('origin')),
        Upgrade: 'TLS/1.3'
      }
    }
  );
}

function actorFromAuth(
  auth: WorkspaceAuthSuccess | IntelligenceMcpAuthSuccess | WorkspaceAuthFailure
): McpLogActor | null {
  if (auth.ok) {
    return {
      organizationId: auth.context.organizationId,
      apiKeyId: auth.context.apiKeyId,
      oauthGrantId: auth.oauthGrantId
    };
  }
  if (auth.organizationId) {
    return {
      organizationId: auth.organizationId,
      apiKeyId: auth.apiKeyId ?? null,
      oauthGrantId: auth.oauthGrantId ?? null
    };
  }
  return null;
}

function recordMcpLog(
  startedAt: number,
  actor: McpLogActor | null,
  fields: {
    method: string;
    tool?: string;
    status: number;
    errorMessage?: string;
  }
): void {
  if (!actor) {
    return;
  }
  logMcpRequest({
    organizationId: actor.organizationId,
    apiKeyId: actor.apiKeyId,
    oauthGrantId: actor.oauthGrantId,
    method: fields.method,
    tool: fields.tool,
    status: fields.status,
    durationMs: Date.now() - startedAt,
    errorMessage: fields.errorMessage
  });
}

export function OPTIONS(request: NextRequest): Response {
  const blocked = requireHttps(request);
  if (blocked) {
    return blocked;
  }
  return new Response(null, {
    status: 204,
    headers: mcpCorsHeaders(request.headers.get('origin'))
  });
}

/** Unauthenticated GET starts OAuth. Authenticated GET is 405 (POST only). */
export async function GET(request: NextRequest): Promise<Response> {
  const blocked = requireHttps(request);
  if (blocked) {
    return blocked;
  }
  const auth = await authorizeMcpClient(request);
  if (!auth.ok) {
    return mcpUnauthorized(request, null, auth.message, auth.allowOrigin);
  }
  return new Response(null, {
    status: 405,
    headers: {
      ...mcpCorsHeaders(request.headers.get('origin')),
      Allow: 'POST, DELETE, OPTIONS'
    }
  });
}

export async function DELETE(request: NextRequest): Promise<Response> {
  const blocked = requireHttps(request);
  if (blocked) {
    return blocked;
  }
  const auth = await authorizeMcpClient(request);
  if (!auth.ok) {
    if (auth.status === 401) {
      return mcpUnauthorized(request, null, auth.message, auth.allowOrigin);
    }
    return rpcError(null, -32001, auth.message, auth.allowOrigin, auth.status);
  }
  return new Response(null, {
    status: 200,
    headers: mcpCorsHeaders(auth.allowOrigin)
  });
}

export async function POST(request: NextRequest): Promise<Response> {
  const blocked = requireHttps(request);
  if (blocked) {
    return blocked;
  }

  const startedAt = Date.now();
  const origin = request.headers.get('origin');
  let payload: JsonRpcRequest;
  try {
    payload = (await request.json()) as JsonRpcRequest;
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body.' },
      { status: 400, headers: mcpCorsHeaders(origin) }
    );
  }

  const method = typeof payload.method === 'string' ? payload.method : '';
  const id = payload.id;
  const isNotification =
    method.startsWith('notifications/') || id === undefined;

  const handshake = await authorizeMcpClient(request);
  if (!handshake.ok) {
    recordMcpLog(startedAt, actorFromAuth(handshake), {
      method: method || 'unknown',
      status: handshake.status,
      errorMessage: handshake.message
    });
    if (handshake.status === 401) {
      return mcpUnauthorized(
        request,
        id,
        handshake.message,
        handshake.allowOrigin
      );
    }
    return rpcError(
      id,
      -32001,
      handshake.message,
      handshake.allowOrigin,
      handshake.status
    );
  }

  if (method === 'initialize') {
    recordMcpLog(startedAt, actorFromAuth(handshake), {
      method,
      status: 200
    });
    const appUrl = mcpAppUrlFromRequest(request);
    return rpcResult(
      id,
      {
        protocolVersion: negotiateMcpProtocolVersion(
          payload.params?.protocolVersion
        ),
        capabilities: {
          tools: { listChanged: false },
          resources: { listChanged: false },
          prompts: { listChanged: false }
        },
        serverInfo: {
          name: 'humaner',
          title: 'Humaner',
          version: MCP_SERVER_INFO_VERSION,
          websiteUrl: appUrl,
          icons: mcpServerIcons(appUrl)
        }
      },
      origin
    );
  }

  if (method === 'ping') {
    return rpcResult(id, {}, origin);
  }

  if (isNotification) {
    return accepted(origin);
  }

  if (method === 'resources/list' || method === 'resources/templates/list') {
    return rpcResult(id, { resources: [] }, origin);
  }

  if (method === 'prompts/list') {
    return rpcResult(id, { prompts: [] }, origin);
  }

  if (method === 'tools/list') {
    // A client never sees a tool whose every call would be refused: the
    // credential's scopes, activated connectors, and the workspace's
    // intelligence mode (Companion is hidden when MCP owns it) all gate the list.
    const { scopes } = handshake;
    const [intelligenceOn, { integrations }] = await Promise.all([
      readMcpIntelligenceEnabled(handshake.context.organizationId),
      readCompanionWorkspaceRights(handshake.context.organizationId)
    ]);
    const availableWorkspaceTools = WORKSPACE_TOOLS.filter((tool) => {
      if (!workspaceToolAllowedOnDeployment(tool.name)) {
        return false;
      }
      if (!apiKeyHasScope(scopes, scopeForWorkspaceTool(tool.name))) {
        return false;
      }
      const integration = integrationForConnectorTool(tool.name);
      return !integration || integrations.includes(integration);
    });
    const listedTools =
      !isOssDeployment() &&
      intelligenceOn &&
      apiKeyHasScope(scopes, 'intelligence')
        ? [...availableWorkspaceTools, ...MCP_INTELLIGENCE_TOOLS]
        : [...availableWorkspaceTools];
    recordMcpLog(startedAt, actorFromAuth(handshake), {
      method,
      status: 200
    });
    return rpcResult(
      id,
      {
        tools: listedTools.map((tool) => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema
        }))
      },
      handshake.allowOrigin
    );
  }

  if (method === 'tools/call') {
    const params = payload.params ?? {};
    const name = typeof params.name === 'string' ? params.name : '';
    const args =
      params.arguments && typeof params.arguments === 'object'
        ? (params.arguments as Record<string, unknown>)
        : {};

    // Knowledge search (FTS) is read-only and org-scoped — separate scope from mailbox.
    if (resolveMcpIntelligenceToolName(name)) {
      if (isOssDeployment()) {
        return rpcError(id, -32601, 'Unknown tool.', origin);
      }
      const intel = await authorizeMcpIntelligence(request);
      const intelActor = actorFromAuth(intel);

      if (!intel.ok) {
        recordMcpLog(startedAt, intelActor, {
          method,
          tool: name,
          status: intel.status,
          errorMessage: intel.message
        });
        if (intel.status === 401) {
          return mcpUnauthorized(request, id, intel.message, intel.allowOrigin);
        }
        return rpcError(
          id,
          -32001,
          intel.message,
          intel.allowOrigin,
          intel.status
        );
      }

      const intelligenceOn = await readMcpIntelligenceEnabled(
        intel.context.organizationId
      );
      if (!intelligenceOn) {
        const disabledMessage =
          'Intelligence over MCP is off. Enable it in Settings → MCP (this hides Companion).';
        recordMcpLog(startedAt, intelActor, {
          method,
          tool: name,
          status: 403,
          errorMessage: disabledMessage
        });
        return rpcError(id, -32001, disabledMessage, intel.allowOrigin, 403);
      }

      const result = await executeMcpIntelligenceTool(name, args, {
        organizationId: intel.context.organizationId,
        industry: intel.context.industry,
        tier: intel.context.tier
      });
      if (!result.ok) {
        recordMcpLog(startedAt, intelActor, {
          method,
          tool: name,
          status: 400,
          errorMessage: result.error ?? 'Tool failed.'
        });
        return rpcResult(
          id,
          {
            isError: true,
            content: [{ type: 'text', text: result.error ?? 'Tool failed.' }]
          },
          intel.allowOrigin
        );
      }

      recordMcpLog(startedAt, intelActor, {
        method,
        tool: name,
        status: 200
      });
      return rpcResult(
        id,
        {
          content: [{ type: 'text', text: JSON.stringify(result.data) }]
        },
        intel.allowOrigin
      );
    }

    const auth = await authorizeWorkspaceRequest({ request, tool: name });
    const actor = actorFromAuth(auth);

    if (!auth.ok) {
      recordMcpLog(startedAt, actor, {
        method,
        tool: name,
        status: auth.status,
        errorMessage: auth.message
      });
      if (auth.status === 401) {
        return mcpUnauthorized(request, id, auth.message, auth.allowOrigin);
      }
      return rpcError(id, -32001, auth.message, auth.allowOrigin, auth.status);
    }

    const result = await executeWorkspaceTool(name, args, auth.context);
    if (!result.ok) {
      recordMcpLog(startedAt, actor, {
        method,
        tool: name,
        status: 400,
        errorMessage: result.error ?? 'Tool failed.'
      });
      return rpcResult(
        id,
        {
          isError: true,
          content: [{ type: 'text', text: result.error ?? 'Tool failed.' }]
        },
        auth.allowOrigin
      );
    }

    recordMcpLog(startedAt, actor, {
      method,
      tool: name,
      status: 200
    });
    return rpcResult(
      id,
      {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result.data)
          }
        ]
      },
      auth.allowOrigin
    );
  }

  recordMcpLog(startedAt, actorFromAuth(handshake), {
    method: method || 'unknown',
    status: 400,
    errorMessage: `Unknown method: ${method}`
  });
  return rpcError(id, -32601, `Unknown method: ${method}`, origin);
}

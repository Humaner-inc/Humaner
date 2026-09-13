import { NextResponse, type NextRequest } from 'next/server';

import {
  logMcpRequest,
  type McpLogActor
} from '@/lib/developers/log-mcp-request';
import {
  isMcpRequestEncrypted,
  mcpCorsHeaders,
  negotiateMcpProtocolVersion
} from '@/lib/developers/mcp-http';
import {
  authorizeMcpClient,
  authorizeWorkspaceRequest
} from '@/lib/workspace-api/authorize';
import { WORKSPACE_TOOLS } from '@/lib/workspace-api/catalog';
import { executeWorkspaceTool } from '@/lib/workspace-api/execute-tools';

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
  status = 200
): NextResponse {
  return NextResponse.json(
    { jsonrpc: '2.0', id: id ?? null, error: { code, message } },
    { status, headers: mcpCorsHeaders(origin) }
  );
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
  auth: Awaited<ReturnType<typeof authorizeMcpClient>>
): McpLogActor | null {
  if (auth.ok) {
    return {
      organizationId: auth.context.organizationId,
      apiKeyId: auth.context.apiKeyId
    };
  }
  if (auth.organizationId) {
    return {
      organizationId: auth.organizationId,
      apiKeyId: auth.apiKeyId ?? null
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

/** Streamable HTTP: GET SSE is optional. 405 tells Cursor to use POST only. */
export function GET(request: NextRequest): Response {
  const blocked = requireHttps(request);
  if (blocked) {
    return blocked;
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
        serverInfo: { name: 'humaner', version: '1.0.0' }
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
    recordMcpLog(startedAt, actorFromAuth(handshake), {
      method,
      status: 200
    });
    return rpcResult(
      id,
      {
        tools: WORKSPACE_TOOLS.map((tool) => ({
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

    const auth = await authorizeWorkspaceRequest({ request, tool: name });
    const actor: McpLogActor | null = auth.ok
      ? {
          organizationId: auth.context.organizationId,
          apiKeyId: auth.context.apiKeyId
        }
      : auth.organizationId
        ? {
            organizationId: auth.organizationId,
            apiKeyId: auth.apiKeyId ?? null
          }
        : null;

    if (!auth.ok) {
      recordMcpLog(startedAt, actor, {
        method,
        tool: name,
        status: auth.status,
        errorMessage: auth.message
      });
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

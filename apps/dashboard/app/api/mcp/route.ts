import { NextResponse, type NextRequest } from 'next/server';

import {
  intelligenceCorsHeaders,
  intelligenceJsonError
} from '@/lib/intelligence/http';
import { authorizeWorkspaceRequest } from '@/lib/workspace-api/authorize';
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
    { headers: intelligenceCorsHeaders(origin) }
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
    { status, headers: intelligenceCorsHeaders(origin) }
  );
}

export function OPTIONS(request: NextRequest): Response {
  return new Response(null, {
    status: 204,
    headers: intelligenceCorsHeaders(request.headers.get('origin') ?? '*')
  });
}

export async function POST(request: NextRequest): Promise<Response> {
  const origin = request.headers.get('origin');
  let payload: JsonRpcRequest;
  try {
    payload = (await request.json()) as JsonRpcRequest;
  } catch {
    return intelligenceJsonError(400, 'Invalid JSON body.', origin);
  }

  const method = typeof payload.method === 'string' ? payload.method : '';
  const id = payload.id;

  if (method === 'initialize') {
    return rpcResult(
      id,
      {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'humaner', version: '1.0.0' }
      },
      origin
    );
  }

  if (method === 'notifications/initialized' || method === 'ping') {
    return rpcResult(id, {}, origin);
  }

  if (method === 'tools/list') {
    let auth = await authorizeWorkspaceRequest({
      request,
      tool: 'list_mail_threads'
    });
    if (!auth.ok) {
      auth = await authorizeWorkspaceRequest({
        request,
        tool: 'list_calendar_events'
      });
    }
    if (!auth.ok) {
      return rpcError(id, -32001, auth.message, auth.allowOrigin, auth.status);
    }
    return rpcResult(
      id,
      {
        tools: WORKSPACE_TOOLS.map((tool) => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema
        }))
      },
      auth.allowOrigin
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
    if (!auth.ok) {
      return rpcError(id, -32001, auth.message, auth.allowOrigin, auth.status);
    }

    const result = await executeWorkspaceTool(name, args, auth.context);
    if (!result.ok) {
      return rpcResult(
        id,
        {
          isError: true,
          content: [{ type: 'text', text: result.error ?? 'Tool failed.' }]
        },
        auth.allowOrigin
      );
    }

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

  return rpcError(id, -32601, `Unknown method: ${method}`, origin);
}

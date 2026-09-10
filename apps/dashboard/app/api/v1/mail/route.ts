import type { NextRequest } from 'next/server';

import {
  handleWorkspaceOptions,
  handleWorkspaceRest
} from '@/lib/workspace-api/handle-rest';

export function OPTIONS(request: NextRequest): Promise<Response> {
  return handleWorkspaceOptions(request);
}

export async function POST(request: NextRequest): Promise<Response> {
  const clone = request.clone();
  let tool = 'list_mail_threads';
  try {
    const body = (await clone.json()) as { tool?: string };
    if (typeof body.tool === 'string' && body.tool.trim()) {
      tool = body.tool.trim();
    }
  } catch {
    // handleWorkspaceRest parses the original body
  }
  return handleWorkspaceRest(request, tool);
}

import 'server-only';

import type { WorkspaceToolContext } from '@/lib/workspace-api/authorize';

type OutboundToolResult = {
  ok: boolean;
  data?: unknown;
  error?: string;
};

const CLOUD_ONLY: OutboundToolResult = {
  ok: false,
  error: 'Outbound is Cloud-only.'
};

export async function executeAddProspects(
  _args: Record<string, unknown>,
  _context: WorkspaceToolContext
): Promise<OutboundToolResult> {
  return CLOUD_ONLY;
}

export async function executeListProspects(
  _args: Record<string, unknown>,
  _context: WorkspaceToolContext
): Promise<OutboundToolResult> {
  return CLOUD_ONLY;
}

export async function executeUpdateContact(
  _args: Record<string, unknown>,
  _context: WorkspaceToolContext
): Promise<OutboundToolResult> {
  return CLOUD_ONLY;
}

export async function executeCreateWave(
  _args: Record<string, unknown>,
  _context: WorkspaceToolContext
): Promise<OutboundToolResult> {
  return CLOUD_ONLY;
}

export async function executeGetWaveReview(
  _args: Record<string, unknown>,
  _context: WorkspaceToolContext
): Promise<OutboundToolResult> {
  return CLOUD_ONLY;
}

export async function executeGetWaveResults(
  _args: Record<string, unknown>,
  _context: WorkspaceToolContext
): Promise<OutboundToolResult> {
  return CLOUD_ONLY;
}

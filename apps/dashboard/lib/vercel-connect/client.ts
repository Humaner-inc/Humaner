import 'server-only';

import type { CompanionIntegrationId } from '@/lib/inbox/companion-rights';
import { VERCEL_CONNECT_APPS } from '@/lib/vercel-connect/catalog';

/**
 * Self-Host has no Vercel Connect. Linear, GitHub, Stripe, and Notion stay on
 * Cloud. Workspace mail/task tools do not call this.
 */

const CONNECT_UNAVAILABLE = 'Connect apps are not available on Self-Host.';

export function connectSubjectId(organizationId: string): string {
  return `org:${organizationId}`;
}

export function connectCallbackUrl(_id: CompanionIntegrationId): string {
  return '';
}

export async function hasConnectGrant(
  _organizationId: string,
  _id: CompanionIntegrationId
): Promise<boolean> {
  return false;
}

export async function startConnectAuthorization(
  _organizationId: string,
  id: CompanionIntegrationId
): Promise<{ url: string } | { alreadyConnected: true }> {
  throw new Error(
    `${VERCEL_CONNECT_APPS[id].name} connect is not available on Self-Host.`
  );
}

export async function completeConnectAuthorization(
  _organizationId: string,
  _id: CompanionIntegrationId
): Promise<void> {
  throw new Error(CONNECT_UNAVAILABLE);
}

export async function revokeConnectAuthorization(
  _organizationId: string,
  _id: CompanionIntegrationId
): Promise<void> {
  // Connect grants are Cloud-only.
}

export function connectErrorMessage(_error: unknown, name: string): string {
  return `${name} connect is not available on Self-Host.`;
}

export type ConnectAccessToken =
  | { ok: true; token: string; tenantId?: string; workspace?: string }
  | { ok: false; error: string };

export async function getConnectAccessToken(
  _organizationId: string,
  id: CompanionIntegrationId
): Promise<ConnectAccessToken> {
  return {
    ok: false,
    error: `${VERCEL_CONNECT_APPS[id].name} is not available on Self-Host.`
  };
}

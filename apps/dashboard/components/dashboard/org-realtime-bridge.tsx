'use client';

import { useOrgRealtime } from '@/hooks/use-org-realtime';

/**
 * Mounts org SSE subscription inside the dashboard shell so desk/inbox
 * mutations from other teammates trigger `router.refresh()`.
 */
export function OrgRealtimeBridge({
  enabled = true
}: {
  enabled?: boolean;
}): null {
  useOrgRealtime({ enabled });
  return null;
}

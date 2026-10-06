import 'server-only';

import type { WorkspaceBillingAccessDto } from '@humaner/shared/billing-access';

const NO_ACCESS: WorkspaceBillingAccessDto = {
  readOnly: false,
  banner: null
};

export async function resolveWorkspaceBillingAccess(
  _organizationId: string
): Promise<WorkspaceBillingAccessDto> {
  return NO_ACCESS;
}

export async function assertWorkspaceWritable(
  _organizationId: string
): Promise<void> {
  // Self-Host has no Polar billing lock.
}

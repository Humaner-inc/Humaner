import 'server-only';

import { requireAdmin } from '@/lib/auth/permissions';
import { ForbiddenError } from '@/lib/validation/exceptions';

import { isDemoAgentRole } from './demo-agent-role';

export async function assertCanMutateDemoAgent(
  role: string,
  userId: string
): Promise<void> {
  if (!isDemoAgentRole(role)) {
    return;
  }
  try {
    await requireAdmin(userId);
  } catch {
    throw new ForbiddenError(
      'Demo agents can only be changed by platform admins.'
    );
  }
}

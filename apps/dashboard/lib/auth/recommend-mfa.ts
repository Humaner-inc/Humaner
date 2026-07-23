import 'server-only';

import { Role, WorkspaceRole } from '@prisma/client';

import { prisma } from '@/lib/db/prisma';

/** Owners / platform admins should enable TOTP — optional, not enforced. */
export async function shouldRecommendMfa(
  userId: string,
  workspaceRole: WorkspaceRole,
  role: Role
): Promise<boolean> {
  const isPrivileged =
    workspaceRole === WorkspaceRole.OWNER || role === Role.ADMIN;
  if (!isPrivileged) {
    return false;
  }

  const mfaCount = await prisma.authenticatorApp.count({
    where: { userId }
  });

  return mfaCount === 0;
}

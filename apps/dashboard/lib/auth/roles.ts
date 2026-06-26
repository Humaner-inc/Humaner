import { Role } from '@prisma/client';

import { ForbiddenError } from '@/lib/validation/exceptions';

/**
 * Roles assignable through the application.
 * Role.ADMIN is for Humaner platform operators (set manually in DB).
 * Workspace ownership uses WorkspaceRole.OWNER instead.
 */
export const APP_ASSIGNABLE_ROLE = Role.MEMBER;

export function rejectAdminRoleAssignment(role: Role): void {
  if (role === Role.ADMIN) {
    throw new ForbiddenError(
      'Admin role cannot be assigned through the app. Update the database manually.'
    );
  }
}

export function toAppAssignableRole(role: Role): Role {
  rejectAdminRoleAssignment(role);
  return APP_ASSIGNABLE_ROLE;
}

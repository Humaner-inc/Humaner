import { Role } from '@prisma/client';

import { ForbiddenError } from '@/lib/validation/exceptions';

/**
 * Roles assignable through the application.
 * Admin is reserved for manual updates in the database only.
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

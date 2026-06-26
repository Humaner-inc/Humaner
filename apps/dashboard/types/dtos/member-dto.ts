import type { Role, WorkspaceRole } from '@prisma/client';

export type MemberDto = {
  id: string;
  image?: string;
  name: string;
  email: string;
  role: Role;
  workspaceRole: WorkspaceRole;
  allowedPages: string[];
  dateAdded: Date;
  lastLogin?: Date;
};

import type { Role } from '@prisma/client';

export type MemberDto = {
  id: string;
  image?: string;
  name: string;
  email: string;
  role: Role;
  dateAdded: Date;
  lastLogin?: Date;
};

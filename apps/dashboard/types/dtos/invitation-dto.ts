import type { InvitationStatus, Role } from '@prisma/client';

export type InvitationDto = {
  id: string;
  token: string;
  status: InvitationStatus;
  email: string;
  role: Role;
  allowedPages: string[];
  lastSent?: Date;
  dateAdded: Date;
};

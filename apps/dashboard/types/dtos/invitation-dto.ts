import type { InvitationStatus, Role } from '@prisma/client';

export type InvitationDto = {
  id: string;
  token: string;
  status: InvitationStatus;
  email: string;
  role: Role;
  allowedPages: string[];
  allowedAliasIds: string[];
  timeZone?: string | null;
  lastSent?: Date;
  dateAdded: Date;
};

import { type Role, type WorkspaceRole } from '@prisma/client';

import type { PersonalDetailsDto } from '@/types/dtos/personal-details-dto';
import type { PreferencesDto } from '@/types/dtos/preferences-dto';

export type ProfileDto = PersonalDetailsDto &
  PreferencesDto & {
    role: Role;
    workspaceRole: WorkspaceRole;
    allowedPages: string[];
  };

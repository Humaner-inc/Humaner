import { type Role } from '@prisma/client';

import type { PersonalDetailsDto } from '@/types/dtos/personal-details-dto';
import type { PreferencesDto } from '@/types/dtos/preferences-dto';

export type ProfileDto = PersonalDetailsDto & PreferencesDto & { role: Role };

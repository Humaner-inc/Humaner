import type { CharacterType } from '@prisma/client';

import { CHARACTER_META } from '@/lib/character-presets';

export function resolveAgentAvatarSrc(
  image: string | null | undefined,
  character: CharacterType
): string {
  if (image) {
    return image;
  }

  return CHARACTER_META[character].image;
}

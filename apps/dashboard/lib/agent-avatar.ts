import type { CharacterType } from '@prisma/client';

import { CHARACTER_META } from '@/lib/character-presets';
import { toSameOriginImageUrl } from '@/lib/urls/to-same-origin-image-url';

export function resolveAgentAvatarSrc(
  image: string | null | undefined,
  character: CharacterType
): string {
  const custom = toSameOriginImageUrl(image);
  if (custom) {
    return custom;
  }

  return CHARACTER_META[character].image;
}

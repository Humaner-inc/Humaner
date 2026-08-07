import type { CharacterType } from '@prisma/client';

import { CHARACTER_META } from '@/lib/character-presets';
import { isOssDeployment } from '@/lib/deployment-mode';
import { toSameOriginImageUrl } from '@/lib/urls/to-same-origin-image-url';

/** Self-Host starter agent — matches onboarding Bot tile (zinc + bot glyph). */
export const OSS_STARTER_AGENT_AVATAR = '/personas/acme-bot.svg';

export function resolveAgentAvatarSrc(
  image: string | null | undefined,
  character: CharacterType
): string {
  const custom = toSameOriginImageUrl(image);
  if (custom) {
    return custom;
  }

  if (isOssDeployment() && character === 'CUSTOM') {
    return OSS_STARTER_AGENT_AVATAR;
  }

  return CHARACTER_META[character].image;
}

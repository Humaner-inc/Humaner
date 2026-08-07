import type { CharacterType } from '@prisma/client';

import { CHARACTER_META } from '@/lib/character-presets';
import { isOssDeployment } from '@/lib/deployment-mode';
import { toSameOriginImageUrl } from '@/lib/urls/to-same-origin-image-url';

/** Self-Host starter agent — bot glyph (sharp square, matches Humaner chrome). */
export const OSS_STARTER_AGENT_AVATAR = '/personas/starter-bot.svg';

export function resolveAgentAvatarSrc(
  image: string | null | undefined,
  character: CharacterType
): string {
  const custom = toSameOriginImageUrl(image);
  if (custom) {
    // Legacy Self-Host starter path → current asset.
    if (custom.endsWith('/personas/acme-bot.svg')) {
      return OSS_STARTER_AGENT_AVATAR;
    }
    return custom;
  }

  if (isOssDeployment() && character === 'CUSTOM') {
    return OSS_STARTER_AGENT_AVATAR;
  }

  return CHARACTER_META[character].image;
}

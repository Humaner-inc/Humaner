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

function isPersonaCircleAsset(src: string): boolean {
  return Object.values(CHARACTER_META).some(
    (meta) => src === meta.image || src.endsWith(meta.image)
  );
}

/** Sidebar avatars: persona disks as full color squares, uploads as photos. */
export function resolveSidebarAgentAvatar(
  image: string | null | undefined,
  character: CharacterType
): { kind: 'disk'; color: string } | { kind: 'image'; src: string } {
  const src = resolveAgentAvatarSrc(image, character);
  if (isPersonaCircleAsset(src)) {
    return { kind: 'disk', color: CHARACTER_META[character].disk };
  }
  return { kind: 'image', src };
}

/** Avatar URL safe to load from marketing site or widget embeds. */
export function resolvePublicAgentAvatarUrl(
  image: string | null | undefined,
  character: CharacterType,
  appBaseUrl: string
): string {
  const src = resolveAgentAvatarSrc(image, character);
  // Absolute app-origin URLs so cross-origin surfaces (landing Ask Humaner)
  // can load custom uploads and persona assets from the dashboard host.
  if (src.startsWith('/') && !src.startsWith('//')) {
    return `${appBaseUrl.replace(/\/$/, '')}${src}`;
  }
  return src;
}

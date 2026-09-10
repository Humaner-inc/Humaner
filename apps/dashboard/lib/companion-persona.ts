import type { CharacterType } from '@prisma/client';

import { CHARACTER_META } from '@/lib/character-presets';

/** Persona disk for the filled Companion mark. Unique follows theme ink. */
export function companionPersonaColor(
  character: CharacterType
): string | undefined {
  if (character === 'CUSTOM') {
    return undefined;
  }

  return CHARACTER_META[character].disk;
}

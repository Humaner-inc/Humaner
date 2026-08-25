import { PERSONA_DISK } from '@humaner/shared/archetypes';
import type { PersonalityAccess } from '@humaner/shared/plans';
import type {
  CharacterType,
  EmojiMode,
  Formality,
  OpenerStyle,
  Verbosity
} from '@prisma/client';

export type CharacterMeta = {
  id: CharacterType;
  /** Default agent name when this persona is selected. */
  personaName: string | null;
  /** Tone label — Casual, Corporate, Efficient. */
  label: string;
  tagline: string;
  /** Profile cover image in /public. */
  image: string;
  /** Landing-matching solid disk used when the portrait is a color circle. */
  disk: string;
  example: string;
};

export const CHARACTER_META: Record<CharacterType, CharacterMeta> = {
  CASUAL: {
    id: 'CASUAL',
    personaName: 'Astral',
    label: 'Casual',
    tagline: 'Warm, human, contractions. A knowledgeable friend.',
    image: '/personas/Astral.png',
    disk: PERSONA_DISK.casual,
    example:
      "Hey, totally get that. It's a bit confusing on first sign-up. Go to Settings → Account and hit reset. Takes 30 seconds!"
  },
  CORPORATE: {
    id: 'CORPORATE',
    personaName: 'Taleb',
    label: 'Corporate',
    tagline: 'Polished, complete sentences. The voice of a well-run company.',
    image: '/personas/Taleb.png',
    disk: PERSONA_DISK.corporate,
    example:
      'Thank you for reaching out. To resolve this, please navigate to Settings, select Account, and click Reset. The change takes effect immediately.'
  },
  EFFICIENT: {
    id: 'EFFICIENT',
    personaName: 'Vidi',
    label: 'Efficient',
    tagline: 'Confident, direct, zero filler. Answers in the fewest words.',
    image: '/personas/Vidi.png',
    disk: PERSONA_DISK.efficient,
    example:
      'Settings → Account → Reset. Done in 30 seconds. Still broken? support@company.com.'
  },
  CUSTOM: {
    id: 'CUSTOM',
    personaName: 'Unique',
    label: 'Zero preset',
    tagline: 'Your own voice. Write the character prompt from scratch.',
    image: '/personas/Unique.png',
    disk: PERSONA_DISK.custom,
    example:
      'Define how your agent speaks: tone, style, and boundaries, in your own words.'
  }
};

export function getDefaultAgentName(character: CharacterType): string {
  return CHARACTER_META[character].personaName ?? '';
}

/** True when the name is still a built-in persona label (Astral / Taleb / Vidi). */
export function isPresetAgentName(name: string): boolean {
  const trimmed = name.trim();
  if (!trimmed) {
    return true;
  }

  return Object.values(CHARACTER_META).some(
    (meta) => meta.personaName != null && meta.personaName === trimmed
  );
}

export function formatPersonaToneCaption(meta: CharacterMeta): string {
  return meta.id === 'CUSTOM' ? meta.label : `${meta.label} tone`;
}

/** Card / summary label — Casual, Corporate, Efficient, Unique. */
export function formatPersonaToneName(meta: CharacterMeta): string {
  return meta.id === 'CUSTOM' ? 'Unique' : meta.label;
}

/** Onboarding and other flows outside /dashboard — presets only, no Unique. */
export const STANDARD_CHARACTER_LIST: CharacterMeta[] = [
  CHARACTER_META.CASUAL,
  CHARACTER_META.CORPORATE,
  CHARACTER_META.EFFICIENT
];

/** Full personality list for /dashboard agent create & edit. */
export const DASHBOARD_CHARACTER_LIST: CharacterMeta[] =
  Object.values(CHARACTER_META);

export function getSelectableCharacters(
  access: PersonalityAccess
): CharacterMeta[] {
  if (access === 'all') {
    return DASHBOARD_CHARACTER_LIST;
  }

  if (access === 'custom-only') {
    return [CHARACTER_META.CUSTOM];
  }

  return [CHARACTER_META.CORPORATE];
}

type Option<T extends string> = {
  value: T;
  label: string;
  hint: string;
};

export const VERBOSITY_OPTIONS: Option<Verbosity>[] = [
  { value: 'CONCISE', label: 'Concise', hint: '1–2 sentences' },
  { value: 'BALANCED', label: 'Balanced', hint: '2–4 sentences' },
  { value: 'DETAILED', label: 'Detailed', hint: 'Context & next steps' }
];

export const FORMALITY_OPTIONS: Option<Formality>[] = [
  { value: 'RELAXED', label: 'Relaxed', hint: 'Contractions welcome' },
  { value: 'STANDARD', label: 'Standard', hint: 'Matches the character' },
  { value: 'ELEVATED', label: 'Elevated', hint: 'More formal, no contractions' }
];

export const EMOJI_OPTIONS: Option<EmojiMode>[] = [
  { value: 'NONE', label: 'None', hint: 'No emoji' },
  { value: 'SUBTLE', label: 'Subtle', hint: '1 max, where it fits' },
  { value: 'EXPRESSIVE', label: 'Expressive', hint: 'Freely, for energy' }
];

export const OPENER_OPTIONS: Option<OpenerStyle>[] = [
  { value: 'DIRECT', label: 'Direct', hint: 'Straight to the answer' },
  { value: 'WARM', label: 'Warm', hint: 'Brief acknowledgment first' },
  { value: 'MIRRORING', label: 'Mirroring', hint: 'Reference their question' }
];

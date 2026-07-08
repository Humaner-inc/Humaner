import type {
  CharacterType,
  EmojiMode,
  Formality,
  OpenerStyle,
  Verbosity
} from '@prisma/client';
import type { PersonalityAccess } from '@humaner/shared/plans';

export type CharacterMeta = {
  id: CharacterType;
  label: string;
  tagline: string;
  /** Profile cover image in /public. */
  image: string;
  example: string;
};

export const CHARACTER_META: Record<CharacterType, CharacterMeta> = {
  CASUAL: {
    id: 'CASUAL',
    label: 'Casual',
    tagline: 'Warm, human, contractions. A knowledgeable friend.',
    image: '/caracters/gradient_1.jpg',
    example:
      "Hey, totally get that — it's a bit confusing on first sign-up. Go to Settings → Account and hit reset. Takes 30 seconds!"
  },
  CORPORATE: {
    id: 'CORPORATE',
    label: 'Corporate',
    tagline: 'Polished, complete sentences. The voice of a well-run company.',
    image: '/caracters/gradient_5.jpg',
    example:
      'Thank you for reaching out. To resolve this, please navigate to Settings, select Account, and click Reset. The change takes effect immediately.'
  },
  EFFICIENT: {
    id: 'EFFICIENT',
    label: 'Efficient',
    tagline: 'Confident, direct, zero filler. Answers in the fewest words.',
    image: '/caracters/gradient_2.png',
    example: 'Settings → Account → Reset. Done in 30 seconds. Still broken? support@company.com.'
  },
  CUSTOM: {
    id: 'CUSTOM',
    label: 'Custom',
    tagline: 'Your own voice. Write the character prompt from scratch.',
    image: '/caracters/gradient_4.jpg',
    example:
      'Define how your agent speaks — tone, style, boundaries — in your own words.'
  }
};

/** Onboarding and other flows outside /dashboard — presets only, no Custom. */
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

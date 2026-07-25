import {
  getIndustry,
  SKILLZ_VERSION
} from '@humaner/customer-support-skillz/runtime';
import type {
  CharacterType,
  EmojiMode,
  Formality,
  IndustryType,
  OpenerStyle,
  Verbosity
} from '@prisma/client';

import type { SystemPromptAgent } from '@/lib/build-system-prompt';

/**
 * Vertical Configuration for Agent Training / Prompts
 *
 * Uses the slim `@humaner/customer-support-skillz/runtime` entry (baseline
 * skills only — no problem-solving procedure markdown) so chat cold starts
 * stay small and fast.
 *
 * Persona presets (character, verbosity, formality, emoji mode, opener style)
 * are Humaner's Core Skillz (Layer 1) and stay private in this file.
 *
 * Do not hand-author structural content here. Edit the markdown skill files in
 * the catalog repo (`industries/<name>/<skill>/SKILL.md`) instead.
 */

/** Runtime catalog shape — keep in sync with skillz `dist/runtime.d.ts`. */
type SkillzRuntimePackage = {
  id: string;
  skills: {
    core: {
      name: string;
      description: string;
      type: 'core';
      baselineTone: string[];
      fallback: string;
      commonTopics: string[];
      domainTerms: string;
      exampleBusinessTypes: string;
    };
    behavior: {
      name: string;
      description: string;
      type: 'behavior';
      rules: string[];
      evalCommon: string[];
      evalEdge: string[];
    };
    escalation: {
      name: string;
      description: string;
      type: 'escalation';
      triggers: string[];
      evalEscalation: string[];
    };
    guardrails: {
      name: string;
      description: string;
      type: 'guardrails';
      forbiddenTopics: string[];
      evalTraps: string[];
    };
  };
};

export type PersonaPreset = {
  character: CharacterType;
  verbosity: Verbosity;
  formality: Formality;
  emojiMode: EmojiMode;
  openerStyle: OpenerStyle;
  allowTypos: boolean;
  typoExceptions: string[];
  role: string;
  name: string;
  fallbackMessage: string;
};

export type VerticalConfig = {
  id: IndustryType;
  name: string;
  description: string;
  icon: string;
  color: string;
  personaPreset: PersonaPreset;
  commonTopics: string[];
  domainTerms: string[];
  questionCategories: {
    common: string[];
    edge: string[];
    trap: string[];
    escalation: string[];
  };
  behavioralRules: string[];
  escalationTriggers: string[];
  forbiddenTopics: string[];
  exampleBusinessTypes: string[];
};

/** Maps Humaner's Prisma `IndustryType` to the catalog's package id. */
const PACKAGE_ID_BY_INDUSTRY: Record<IndustryType, string> = {
  ECOMMERCE: 'retail',
  EDUCATION: 'digital-services',
  FITNESS: 'wellness',
  TRAVEL: 'hospitality'
};

const INDUSTRY_IDS = Object.keys(PACKAGE_ID_BY_INDUSTRY) as IndustryType[];

/**
 * PRIVATE persona presets per industry (Layer 1 Core Skillz).
 * These are NOT open-sourced. The OSS catalog provides only generic structural
 * content; persona dimensions are Humaner's private runtime concern.
 */
const PERSONA_PRESETS: Record<IndustryType, PersonaPreset> = {
  ECOMMERCE: {
    character: 'CASUAL',
    verbosity: 'BALANCED',
    formality: 'STANDARD',
    emojiMode: 'SUBTLE',
    openerStyle: 'MIRRORING',
    allowTypos: true,
    typoExceptions: ['order numbers', 'prices', 'dates', 'tracking numbers'],
    role: 'customer support specialist',
    name: 'Alex',
    fallbackMessage: ''
  },
  EDUCATION: {
    character: 'CORPORATE',
    verbosity: 'DETAILED',
    formality: 'STANDARD',
    emojiMode: 'NONE',
    openerStyle: 'WARM',
    allowTypos: false,
    typoExceptions: [],
    role: 'support specialist',
    name: 'Jordan',
    fallbackMessage: ''
  },
  FITNESS: {
    character: 'CASUAL',
    verbosity: 'CONCISE',
    formality: 'RELAXED',
    emojiMode: 'SUBTLE',
    openerStyle: 'WARM',
    allowTypos: true,
    typoExceptions: ['prices', 'dates', 'membership IDs'],
    role: 'member support specialist',
    name: 'Sam',
    fallbackMessage: ''
  },
  TRAVEL: {
    character: 'EFFICIENT',
    verbosity: 'BALANCED',
    formality: 'ELEVATED',
    emojiMode: 'NONE',
    openerStyle: 'DIRECT',
    allowTypos: false,
    typoExceptions: [],
    role: 'guest relations specialist',
    name: 'Taylor',
    fallbackMessage: ''
  }
};

const INDUSTRY_META: Record<
  IndustryType,
  { name: string; icon: string; color: string }
> = {
  ECOMMERCE: { name: 'Retail', icon: '\u{1F6D2}', color: '#10B981' },
  EDUCATION: {
    name: 'Digital Services',
    icon: '\u{1F393}',
    color: '#6366F1'
  },
  FITNESS: { name: 'Wellness', icon: '\u{1F4AA}', color: '#F59E0B' },
  TRAVEL: { name: 'Hospitality', icon: '\u2708\uFE0F', color: '#3B82F6' }
};

function parseTermsList(paragraph: string): string[] {
  const colonIdx = paragraph.indexOf(':');
  const terms = colonIdx !== -1 ? paragraph.slice(colonIdx + 1) : paragraph;
  return terms
    .replace(/\.$/, '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

function adaptIndustry(
  industry: IndustryType,
  pkg: SkillzRuntimePackage
): VerticalConfig {
  const { skills } = pkg;
  const persona = { ...PERSONA_PRESETS[industry] };
  persona.fallbackMessage = skills.core.fallback;
  const meta = INDUSTRY_META[industry];

  return {
    id: industry,
    name: meta.name,
    description: skills.core.description,
    icon: meta.icon,
    color: meta.color,
    personaPreset: persona,
    commonTopics: skills.core.commonTopics,
    domainTerms: parseTermsList(skills.core.domainTerms),
    questionCategories: {
      common: skills.behavior.evalCommon,
      edge: skills.behavior.evalEdge,
      trap: skills.guardrails.evalTraps,
      escalation: skills.escalation.evalEscalation
    },
    behavioralRules: skills.behavior.rules,
    escalationTriggers: skills.escalation.triggers,
    forbiddenTopics: skills.guardrails.forbiddenTopics,
    exampleBusinessTypes: skills.core.exampleBusinessTypes
      ? parseTermsList(skills.core.exampleBusinessTypes)
      : []
  };
}

function requireSkillzPackage(industry: IndustryType): SkillzRuntimePackage {
  const packageId = PACKAGE_ID_BY_INDUSTRY[industry];
  const pkg = getIndustry(packageId) as SkillzRuntimePackage | undefined;
  if (!pkg) {
    throw new Error(
      `@humaner/customer-support-skillz/runtime package "${packageId}" not found for industry "${industry}". ` +
        'Reinstall `@humaner/customer-support-skillz` (>=0.3.2) and ensure the package version includes this industry.'
    );
  }
  return pkg;
}

/** Adapt one industry on first use — avoid paying for all four at cold start. */
const verticalConfigCache = new Map<IndustryType, VerticalConfig>();

export function getVerticalConfig(industry: IndustryType): VerticalConfig {
  const cached = verticalConfigCache.get(industry);
  if (cached) return cached;
  const config = adaptIndustry(industry, requireSkillzPackage(industry));
  verticalConfigCache.set(industry, config);
  return config;
}

/**
 * Lazy record view over `getVerticalConfig` so existing
 * `VERTICAL_CONFIGS[industry]` call sites stay valid without eager adaptation.
 */
export const VERTICAL_CONFIGS: Record<IndustryType, VerticalConfig> = new Proxy(
  {} as Record<IndustryType, VerticalConfig>,
  {
    get(_target, prop) {
      if (typeof prop === 'string' && prop in PACKAGE_ID_BY_INDUSTRY) {
        return getVerticalConfig(prop as IndustryType);
      }
      return undefined;
    },
    ownKeys() {
      return INDUSTRY_IDS;
    },
    getOwnPropertyDescriptor(_target, prop) {
      if (typeof prop === 'string' && prop in PACKAGE_ID_BY_INDUSTRY) {
        return {
          configurable: true,
          enumerable: true,
          value: getVerticalConfig(prop as IndustryType)
        };
      }
      return undefined;
    },
    has(_target, prop) {
      return typeof prop === 'string' && prop in PACKAGE_ID_BY_INDUSTRY;
    }
  }
);

/** Catalog-level skillz version (same for every industry). */
export const VERTICAL_VERSIONS: Record<IndustryType, string> =
  Object.fromEntries(
    INDUSTRY_IDS.map((industry) => [industry, SKILLZ_VERSION])
  ) as Record<IndustryType, string>;

export function getVerticalVersion(industry: IndustryType): string {
  return VERTICAL_VERSIONS[industry];
}

export function getAllVerticals(): VerticalConfig[] {
  return INDUSTRY_IDS.map((industry) => getVerticalConfig(industry));
}

export function getVerticalColor(industry: IndustryType): string {
  return getVerticalConfig(industry).color;
}

export function getVerticalIcon(industry: IndustryType): string {
  return getVerticalConfig(industry).icon;
}

export function getVerticalPersonaPreset(
  industry: IndustryType
): PersonaPreset {
  return getVerticalConfig(industry).personaPreset;
}

/** Synthetic agent used for platform / vertical training runs. */
export function buildPlatformTrainingAgent(
  industry: IndustryType
): SystemPromptAgent {
  const config = getVerticalConfig(industry);
  return {
    industry,
    character: config.personaPreset.character,
    verbosity: config.personaPreset.verbosity,
    formality: config.personaPreset.formality,
    emojiMode: config.personaPreset.emojiMode,
    openerStyle: config.personaPreset.openerStyle,
    allowTypos: config.personaPreset.allowTypos,
    typoExceptions: config.personaPreset.typoExceptions,
    forbiddenTopics: config.forbiddenTopics,
    fallbackMessage: config.personaPreset.fallbackMessage,
    role: config.personaPreset.role,
    name: config.personaPreset.name,
    hasCrossSessionMemory: false
  };
}

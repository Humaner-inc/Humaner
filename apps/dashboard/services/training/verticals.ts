import type {
  CharacterType,
  EmojiMode,
  Formality,
  IndustryType,
  OpenerStyle,
  Verbosity
} from '@prisma/client';
import {
  getIndustry,
  type IndustryPackage as SkillzIndustryPackage
} from 'customer-support-skillz';

import type { SystemPromptAgent } from '@/lib/build-system-prompt';

/**
 * Vertical Configuration for Agent Training
 *
 * SOURCE OF TRUTH: the open `customer-support-skillz` catalog
 * (https://github.com/Humaner-inc/customer-support-skillz — vendored here
 * via the `customer-support-skillz` npm dependency). This file adapts that
 * catalog's generic, Prisma-agnostic packages into Humaner's internal
 * enum-typed shape.
 *
 * Do not hand-author vocabulary, behavioral rules, escalation triggers,
 * guardrails, or eval scenarios in this file — edit the markdown packages in
 * the catalog repo (`industries/<name>/*.md`) instead, run `npm run build`
 * there, and reinstall this dependency. This keeps content in exactly one
 * place (no dual maintenance) per `Docs/OSS_B2C_B2B_DESK_ROADMAP.md` Phase 4.
 */

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

const CHARACTER_MAP: Record<string, CharacterType> = {
  casual: 'CASUAL',
  corporate: 'CORPORATE',
  efficient: 'EFFICIENT',
  custom: 'CUSTOM'
};
const VERBOSITY_MAP: Record<string, Verbosity> = {
  concise: 'CONCISE',
  balanced: 'BALANCED',
  detailed: 'DETAILED'
};
const FORMALITY_MAP: Record<string, Formality> = {
  relaxed: 'RELAXED',
  standard: 'STANDARD',
  elevated: 'ELEVATED'
};
const EMOJI_MODE_MAP: Record<string, EmojiMode> = {
  none: 'NONE',
  subtle: 'SUBTLE',
  expressive: 'EXPRESSIVE'
};
const OPENER_STYLE_MAP: Record<string, OpenerStyle> = {
  direct: 'DIRECT',
  warm: 'WARM',
  mirroring: 'MIRRORING'
};

function adaptPersona(pkg: SkillzIndustryPackage): PersonaPreset {
  const persona = pkg.persona;
  return {
    character: CHARACTER_MAP[persona.character] ?? 'CASUAL',
    verbosity: VERBOSITY_MAP[persona.verbosity] ?? 'BALANCED',
    formality: FORMALITY_MAP[persona.formality] ?? 'STANDARD',
    emojiMode: EMOJI_MODE_MAP[persona.emojiMode] ?? 'NONE',
    openerStyle: OPENER_STYLE_MAP[persona.openerStyle] ?? 'DIRECT',
    allowTypos: persona.allowTypos === 'true',
    typoExceptions: persona.typoExceptions,
    role: persona.role,
    name: persona.name,
    fallbackMessage: persona.fallbackMessage
  };
}

function adaptIndustry(
  industry: IndustryType,
  pkg: SkillzIndustryPackage
): VerticalConfig {
  return {
    id: industry,
    name: pkg.name,
    description: pkg.description,
    icon: pkg.icon ?? '',
    color: pkg.color ?? '#000000',
    personaPreset: adaptPersona(pkg),
    commonTopics: pkg.vocabulary.commonTopics,
    domainTerms: pkg.vocabulary.domainTerms,
    questionCategories: {
      common: pkg.eval.common,
      edge: pkg.eval.edge,
      trap: pkg.eval.trap,
      escalation: pkg.eval.escalation
    },
    behavioralRules: pkg.behavioralRules,
    escalationTriggers: pkg.escalationTriggers,
    forbiddenTopics: pkg.forbiddenTopics,
    exampleBusinessTypes: pkg.exampleBusinessTypes ?? []
  };
}

function requireSkillzPackage(industry: IndustryType): SkillzIndustryPackage {
  const packageId = PACKAGE_ID_BY_INDUSTRY[industry];
  const pkg = getIndustry(packageId);
  if (!pkg) {
    throw new Error(
      `customer-support-skillz package "${packageId}" not found for industry "${industry}". ` +
        'Run `npm run build` in the customer-support-skillz repo, then reinstall the dependency ' +
        '(pnpm install --filter @humaner/dashboard).'
    );
  }
  return pkg;
}

function buildVerticalConfigs(): Record<IndustryType, VerticalConfig> {
  const industries = Object.keys(PACKAGE_ID_BY_INDUSTRY) as IndustryType[];
  return Object.fromEntries(
    industries.map((industry) => [
      industry,
      adaptIndustry(industry, requireSkillzPackage(industry))
    ])
  ) as Record<IndustryType, VerticalConfig>;
}

export const VERTICAL_CONFIGS: Record<IndustryType, VerticalConfig> =
  buildVerticalConfigs();

/**
 * Per-vertical release versions.
 * Sourced from each package's `SKILL.md` `version` field in the
 * `customer-support-skillz` catalog — bump the package there to bump this.
 * Drives VerticalRelease.version; keyed by (industry, version) in the DB.
 */
export const VERTICAL_VERSIONS: Record<IndustryType, string> =
  Object.fromEntries(
    (Object.keys(PACKAGE_ID_BY_INDUSTRY) as IndustryType[]).map((industry) => [
      industry,
      requireSkillzPackage(industry).version
    ])
  ) as Record<IndustryType, string>;

export function getVerticalVersion(industry: IndustryType): string {
  return VERTICAL_VERSIONS[industry];
}

export function getVerticalConfig(industry: IndustryType): VerticalConfig {
  return VERTICAL_CONFIGS[industry];
}

export function getAllVerticals(): VerticalConfig[] {
  return Object.values(VERTICAL_CONFIGS);
}

export function getVerticalColor(industry: IndustryType): string {
  return VERTICAL_CONFIGS[industry].color;
}

export function getVerticalIcon(industry: IndustryType): string {
  return VERTICAL_CONFIGS[industry].icon;
}

export function getVerticalPersonaPreset(
  industry: IndustryType
): PersonaPreset {
  return VERTICAL_CONFIGS[industry].personaPreset;
}

/** Synthetic agent used for platform / vertical training runs. */
export function buildPlatformTrainingAgent(
  industry: IndustryType
): SystemPromptAgent {
  const config = VERTICAL_CONFIGS[industry];
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

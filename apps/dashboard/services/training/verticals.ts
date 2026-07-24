import type {
  CharacterType,
  EmojiMode,
  Formality,
  IndustryType,
  OpenerStyle,
  Verbosity
} from '@prisma/client';
import { getIndustry, SKILLZ_VERSION } from 'customer-support-skillz';

import type { SystemPromptAgent } from '@/lib/build-system-prompt';

/**
 * Vertical Configuration for Agent Training
 *
 * Structural content (behavioral rules, escalation triggers, guardrails, eval
 * scenarios, vocabulary, problem-solving skills) comes from the open
 * `customer-support-skillz` catalog:
 * https://github.com/Humaner-inc/customer-support-skillz
 *
 * Persona presets (character, verbosity, formality, emoji mode, opener style)
 * are Humaner's Core Skillz (Layer 1) and stay private in this file.
 *
 * Do not hand-author structural content here. Edit the markdown skill files in
 * the catalog repo (`industries/<name>/<skill>/SKILL.md`) instead.
 */

/**
 * Catalog industry shape (skills-based). Declared locally so the adapter stays
 * stable across `file:` / git installs. Keep in sync with
 * https://github.com/Humaner-inc/customer-support-skillz dist/index.d.ts.
 */
type SkillzCoreSkill = {
  name: string;
  description: string;
  type: 'core';
  baselineTone: string[];
  fallback: string;
  commonTopics: string[];
  domainTerms: string;
  exampleBusinessTypes: string;
};

type SkillzBehaviorSkill = {
  name: string;
  description: string;
  type: 'behavior';
  rules: string[];
  evalCommon: string[];
  evalEdge: string[];
};

type SkillzEscalationSkill = {
  name: string;
  description: string;
  type: 'escalation';
  triggers: string[];
  evalEscalation: string[];
};

type SkillzGuardrailsSkill = {
  name: string;
  description: string;
  type: 'guardrails';
  forbiddenTopics: string[];
  evalTraps: string[];
};

type SkillzProblemSolvingSkill = {
  name: string;
  description: string;
  type: 'problem-solving';
  id: string;
  whenToUse: string;
  procedure: string;
  doNot: string[];
};

type SkillzSkill =
  | SkillzCoreSkill
  | SkillzBehaviorSkill
  | SkillzEscalationSkill
  | SkillzGuardrailsSkill
  | SkillzProblemSolvingSkill;

type SkillzIndustryPackage = {
  id: string;
  skills: {
    core: SkillzCoreSkill;
    behavior: SkillzBehaviorSkill;
    escalation: SkillzEscalationSkill;
    guardrails: SkillzGuardrailsSkill;
    [key: string]: SkillzSkill;
  };
};
/**
 * Vertical Configuration for Agent Training
 *
 * Structural content (behavioral rules, escalation triggers, guardrails, eval
 * scenarios, vocabulary) comes from the open `customer-support-skillz` catalog.
 * Persona presets (character, verbosity, formality, emoji mode, opener style)
 * are Humaner's Core Skillz (Layer 1) and stay private in this file.
 *
 * Do not hand-author structural content here. Edit the markdown skill files in
 * the catalog repo (`industries/<name>/<skill>/SKILL.md`) instead, run
 * `npm run build` there, and reinstall the dependency.
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

export type ProblemSolvingSkill = {
  id: string;
  name: string;
  description: string;
  whenToUse: string;
  procedure: string;
  doNot: string[];
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
  problemSolvingSkills: ProblemSolvingSkill[];
};

/** Maps Humaner's Prisma `IndustryType` to the catalog's package id. */
const PACKAGE_ID_BY_INDUSTRY: Record<IndustryType, string> = {
  ECOMMERCE: 'retail',
  EDUCATION: 'digital-services',
  FITNESS: 'wellness',
  TRAVEL: 'hospitality'
};

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

const BASELINE_SKILL_IDS = new Set([
  'core',
  'behavior',
  'escalation',
  'guardrails'
]);

function adaptIndustry(
  industry: IndustryType,
  pkg: SkillzIndustryPackage
): VerticalConfig {
  const { skills } = pkg;
  const persona = { ...PERSONA_PRESETS[industry] };
  persona.fallbackMessage = skills.core.fallback;
  const meta = INDUSTRY_META[industry];

  const problemSolvingSkills: ProblemSolvingSkill[] = Object.entries(skills)
    .filter(([key]) => !BASELINE_SKILL_IDS.has(key))
    .map(([, skill]) => {
      const ps = skill as SkillzProblemSolvingSkill;
      return {
        id: ps.id ?? ps.name,
        name: ps.name,
        description: ps.description,
        whenToUse: ps.whenToUse ?? '',
        procedure: ps.procedure ?? '',
        doNot: ps.doNot ?? []
      };
    });

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
      : [],
    problemSolvingSkills
  };
}

function requireSkillzPackage(industry: IndustryType): SkillzIndustryPackage {
  const packageId = PACKAGE_ID_BY_INDUSTRY[industry];
  const pkg = getIndustry(packageId) as SkillzIndustryPackage | undefined;
  if (!pkg) {
    throw new Error(
      `customer-support-skillz package "${packageId}" not found for industry "${industry}". ` +
        'Run `npm run build` in https://github.com/Humaner-inc/customer-support-skillz, then reinstall ' +
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
 * Per-vertical release version.
 * Now uses the catalog-level SKILLZ_VERSION since individual industry
 * packages no longer carry their own version field.
 */
export const VERTICAL_VERSIONS: Record<IndustryType, string> =
  Object.fromEntries(
    (Object.keys(PACKAGE_ID_BY_INDUSTRY) as IndustryType[]).map((industry) => [
      industry,
      SKILLZ_VERSION
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

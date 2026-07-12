import type { IndustryType } from '@prisma/client';

import { getIndustry } from '@/lib/industries';

export type IndustryGuardrailPreset = {
  topic: string;
  description: string;
};

const GUARDRAIL_DESCRIPTIONS: Record<string, string> = {
  'Competitor pricing comparisons':
    'Decline price-matching requests and comparisons to other stores.',
  'Legal disputes':
    'Redirect legal or dispute matters to the appropriate team or counsel.',
  'Academic integrity advice':
    'Do not advise on cheating, plagiarism, or bypassing course rules.',
  'Recommending competing courses':
    'Avoid suggesting rival programs or external course providers.',
  'Medical advice':
    'Do not provide medical guidance; direct to qualified professionals.',
  'Injury diagnosis': 'Do not diagnose injuries or physical conditions.',
  'Nutrition prescriptions':
    'Do not prescribe diets, supplements, or nutrition plans.',
  'Competitor comparisons':
    'Avoid comparing the business to rival hotels, airlines, or OTAs.',
  'Legal dispute advice':
    'Redirect legal disputes and liability questions to the proper channel.'
};

export function getIndustryGuardrailPresets(
  industry: IndustryType
): IndustryGuardrailPreset[] {
  return getIndustry(industry).forbiddenTopics.map((topic) => ({
    topic,
    description:
      GUARDRAIL_DESCRIPTIONS[topic] ??
      `Agent will politely decline topics related to: ${topic.toLowerCase()}.`
  }));
}

export function isGuardrailEnabled(
  topic: string,
  forbiddenTopics: string[]
): boolean {
  return forbiddenTopics.includes(topic);
}

export function toggleGuardrailTopic(
  topic: string,
  forbiddenTopics: string[],
  enabled: boolean
): string[] {
  if (enabled) {
    if (forbiddenTopics.includes(topic)) {
      return forbiddenTopics;
    }
    return [...forbiddenTopics, topic];
  }

  return forbiddenTopics.filter((item) => item !== topic);
}

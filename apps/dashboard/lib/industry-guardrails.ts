export type IndustryGuardrailPreset = {
  topic: string;
  description: string;
};

//The master switch turns enforcement off without discarding the operator's topic selection.
export function resolveEffectiveForbiddenTopics(agent: {
  guardrailsEnabled: boolean;
  forbiddenTopics: string[];
}): string[] {
  return agent.guardrailsEnabled ? agent.forbiddenTopics : [];
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

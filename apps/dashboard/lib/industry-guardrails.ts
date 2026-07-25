export type IndustryGuardrailPreset = {
  topic: string;
  description: string;
};

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

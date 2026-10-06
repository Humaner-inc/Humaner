import 'server-only';

export type DetectedContentGap = {
  id: string;
  question: string;
  suggestedAnswer: string | null;
  createdAt: Date;
};

export async function getAgentDetectedContentGaps(
  _agentId: string
): Promise<DetectedContentGap[]> {
  return [];
}

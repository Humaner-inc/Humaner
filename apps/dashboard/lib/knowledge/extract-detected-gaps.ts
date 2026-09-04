/**
 * Self-Host (OSS) twin of `lib/knowledge/extract-detected-gaps.ts`.
 *
 * Knowledge-gap *detection* — inferring which unanswered questions signal a
 * missing knowledge source — is part of Humaner Intelligence and ships only in
 * Cloud. Self-Host analytics keep working (volume, outcomes, satisfaction) but
 * report no detected gaps. josh renames it onto `extract-detected-gaps.ts`.
 */
import type { MessageRole } from '@prisma/client';

export type DetectedContentGap = {
  question: string;
  context: string | null;
  count: number;
  agentId: string;
  agentName: string;
  lastAskedAt: string;
  conversationId: string;
};

type GapConversation = {
  id: string;
  updatedAt: Date;
  agent: { id: string; name: string };
  messages: Array<{
    role: MessageRole;
    content: string;
    unanswered: boolean;
    createdAt: Date;
  }>;
};

export function extractDetectedContentGaps(
  _conversations: GapConversation[]
): DetectedContentGap[] {
  return [];
}

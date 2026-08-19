export type KnowledgeGapCover = {
  agentId?: string;
  title: string;
  coveredAt: Date | string;
};

export type CoverableContentGap = {
  question: string;
  lastAskedAt: string;
  agentId?: string;
};

export function normalizeGapQuestion(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .replace(/[?.!]+$/g, '');
}

function truncatedGapTitle(question: string): string {
  if (question.length <= 255) {
    return question;
  }
  return `${question.slice(0, 252)}...`;
}

export function knowledgeCoverMatchesQuestion(
  question: string,
  coverTitle: string
): boolean {
  const normalizedQuestion = normalizeGapQuestion(question);
  const normalizedTitle = normalizeGapQuestion(coverTitle);
  if (!normalizedQuestion || !normalizedTitle) {
    return false;
  }

  if (normalizedTitle === normalizedQuestion) {
    return true;
  }

  return normalizedTitle === normalizeGapQuestion(truncatedGapTitle(question));
}

function coverAppliesToGap(
  gap: CoverableContentGap,
  cover: KnowledgeGapCover
): boolean {
  if (!cover.agentId || !gap.agentId) {
    return true;
  }
  return cover.agentId === gap.agentId;
}

export function isContentGapCoveredByKnowledge(
  gap: CoverableContentGap,
  covers: KnowledgeGapCover[]
): boolean {
  const askedAt = new Date(gap.lastAskedAt).getTime();
  if (Number.isNaN(askedAt)) {
    return false;
  }

  return covers.some((cover) => {
    if (!coverAppliesToGap(gap, cover)) {
      return false;
    }
    if (!knowledgeCoverMatchesQuestion(gap.question, cover.title)) {
      return false;
    }

    const coveredAt = new Date(cover.coveredAt).getTime();
    if (Number.isNaN(coveredAt)) {
      return false;
    }

    // Hide until a later conversation scan produces a newer unanswered ask.
    return coveredAt >= askedAt;
  });
}

export function filterCoveredContentGaps<T extends CoverableContentGap>(
  gaps: T[],
  covers: KnowledgeGapCover[]
): T[] {
  if (covers.length === 0) {
    return gaps;
  }

  return gaps.filter((gap) => !isContentGapCoveredByKnowledge(gap, covers));
}

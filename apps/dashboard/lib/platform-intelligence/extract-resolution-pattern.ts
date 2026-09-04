import 'server-only';

/**
 * Self-Host (OSS) twin of `lib/platform-intelligence/extract-resolution-pattern.ts`.
 *
 * Platform Intelligence — mining anonymised resolution motions to reinforce
 * runbooks and improve Humaner's models — ships only in Cloud. Self-Host stores
 * nothing to the platform. josh renames it onto `extract-resolution-pattern.ts`.
 */
export type ExtractResolutionPatternInput = {
  organizationId: string;
  agentId: string;
  issueType: string;
  solution: string;
  turnCount?: number;
  firstReplyResolved?: boolean;
};

export async function extractResolutionPattern(
  _input: ExtractResolutionPatternInput
): Promise<{ stored: boolean }> {
  return { stored: false };
}

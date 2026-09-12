export type CompanionTaskProposalKind =
  | 'mail'
  | 'task'
  | 'mention'
  | 'calendar'
  | 'ticket';

export type CompanionTaskProposal = {
  id: string;
  kind: CompanionTaskProposalKind;
  label: string;
  prompt: string;
  href?: string;
  notificationId?: string;
  resourceId?: string;
  createdAt: string;
  startsAt?: string;
  score: number;
};

export const COMPANION_TASK_PROPOSAL_LIMIT = 3;
export const COMPANION_TASK_PROPOSAL_CANDIDATE_LIMIT = 8;

/** Hidden until the next Companion work-suggestions release. */
export const COMPANION_TASK_PROPOSALS_ENABLED = false;

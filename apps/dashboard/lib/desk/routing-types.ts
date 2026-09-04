import type { HandoffTicketUrgency } from '@/types/handoff-ticket';

/**
 * Shared Helpdesk routing shapes. Extracted from `ticket-router.ts` (Cloud
 * heuristics stay private) so Self-Host can build a routing context and assign
 * a human without importing Desk Intelligence.
 */
export type RoutingDecision = {
  routedTo: 'ai' | 'human';
  reason: string;
  suggestedAssigneeKnowledgeAreas?: string[];
};

export type EscalationPolicyRef = {
  urgencyLevel: HandoffTicketUrgency;
  mode: 'LIVE' | 'PRIORITY' | 'STANDARD' | 'SELF_RESOLVING';
  routeToKnowledgeAreas: string[];
  slaMinutes: number | null;
};

export type TeamProfileRef = {
  userId: string;
  knowledgeAreas: string[];
  currentTickets: number;
  maxConcurrent: number;
};

export type RoutingContext = {
  urgency: HandoffTicketUrgency;
  detectedTopics: string[];
  hasClusterMatch: boolean;
  hasRunbookMatch: boolean;
  matchedClusterSuccessRate?: number;
  matchedClusterId?: string;
  matchedRunbookId?: string;
  visitorCompany?: string | null;
  escalationPolicies: EscalationPolicyRef[];
  teamProfiles: TeamProfileRef[];
};

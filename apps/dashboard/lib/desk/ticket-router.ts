import type {
  RoutingContext,
  RoutingDecision,
  TeamProfileRef
} from '@/lib/desk/routing-types';

export type {
  EscalationPolicyRef,
  RoutingContext,
  RoutingDecision,
  TeamProfileRef
} from '@/lib/desk/routing-types';

/**
 * Self-Host (OSS) twin of `lib/desk/ticket-router.ts`.
 *
 * Cloud routing can send work to Agent Desk (loops / runbooks). Self-Host is
 * Helpdesk-only — every ticket goes to a human. Assignee suggestion stays: it
 * is load-balancing, not Intelligence. josh renames this onto `ticket-router.ts`.
 */
export function routeTicket(ctx: RoutingContext): RoutingDecision {
  return {
    routedTo: 'human',
    reason: 'Self-Host routes all tickets to Helpdesk',
    suggestedAssigneeKnowledgeAreas: ctx.detectedTopics
  };
}

export function suggestAssignee(
  knowledgeAreas: string[],
  teamProfiles: TeamProfileRef[]
): string | null {
  if (knowledgeAreas.length === 0 || teamProfiles.length === 0) return null;

  const candidates = teamProfiles
    .filter((profile) => {
      if (profile.currentTickets >= profile.maxConcurrent) return false;
      return profile.knowledgeAreas.some((area) =>
        knowledgeAreas.includes(area)
      );
    })
    .sort((a, b) => {
      const aOverlap = a.knowledgeAreas.filter((area) =>
        knowledgeAreas.includes(area)
      ).length;
      const bOverlap = b.knowledgeAreas.filter((area) =>
        knowledgeAreas.includes(area)
      ).length;

      if (bOverlap !== aOverlap) return bOverlap - aOverlap;

      const aLoad = a.currentTickets / a.maxConcurrent;
      const bLoad = b.currentTickets / b.maxConcurrent;
      return aLoad - bLoad;
    });

  return candidates[0]?.userId ?? null;
}

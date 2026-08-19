import type { EscalationMode } from '@prisma/client';

import { getTierForMode } from '@/lib/desk/escalation-framework';
import type { HandoffTicketUrgency } from '@/types/handoff-ticket';

export function resolveTicketSlaMinutes(input: {
  urgency: HandoffTicketUrgency;
  policies: Array<{
    urgencyLevel: HandoffTicketUrgency;
    mode: EscalationMode;
    slaMinutes: number | null;
    agentId?: string;
  }>;
  agentId?: string;
}): number | null {
  const match = input.policies.find((policy) => {
    if (policy.urgencyLevel !== input.urgency) {
      return false;
    }
    if (input.agentId && policy.agentId && policy.agentId !== input.agentId) {
      return false;
    }
    return true;
  });
  if (match) {
    return match.slaMinutes;
  }

  const fallbackMode =
    input.urgency === 'HIGH'
      ? 'LIVE'
      : input.urgency === 'MEDIUM'
        ? 'STANDARD'
        : 'SELF_RESOLVING';

  return getTierForMode(fallbackMode)?.defaultSlaMinutes ?? null;
}

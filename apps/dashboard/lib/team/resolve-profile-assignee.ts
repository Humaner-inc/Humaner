import 'server-only';

import { suggestAssignee } from '@/lib/desk/ticket-router';
import { loadTeamProfileRefs } from '@/lib/team/load-team-profile-refs';
import { expandRoutingTopics } from '@/lib/team/routing-topics';

export async function resolveProfileAssignee(
  organizationId: string,
  topics: string[]
): Promise<string | null> {
  const expanded = expandRoutingTopics(topics);
  if (expanded.length === 0) return null;
  const profiles = await loadTeamProfileRefs(organizationId);
  return suggestAssignee(expanded, profiles);
}

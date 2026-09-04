import 'server-only';

/**
 * Self-Host (OSS) twin of `lib/desk/feed-cluster.ts`.
 *
 * Loops / clustering — training Agent Desk from resolved Human Desk tickets — is
 * Desk Intelligence and ships only in Cloud. In Self-Host, resolving a ticket
 * still works; it just does not feed a cluster. josh renames it onto
 * `feed-cluster.ts`.
 */
export type FeedClusterInput = {
  organizationId: string;
  ticketId: string;
  pattern: string;
  issueType: string;
  solution: string;
  existingClusterId?: string | null;
};

export type FeedClusterResult = {
  clusterId: string;
  created: boolean;
};

export async function feedClusterFromResolution(
  _input: FeedClusterInput
): Promise<FeedClusterResult | null> {
  return null;
}

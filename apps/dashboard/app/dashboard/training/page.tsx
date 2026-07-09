import { agentKnowledgeRoute } from '@/constants/routes';
import { redirectToAgentScope } from '@/lib/routing/redirect-to-agent-scope';

/** Training now lives inside agent Knowledge — forwards old links. */
export default async function TrainingRedirectPage({
  searchParams
}: {
  searchParams: Promise<{ agent?: string }>;
}): Promise<never> {
  const { agent } = await searchParams;
  return redirectToAgentScope(agentKnowledgeRoute, agent);
}

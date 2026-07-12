import 'server-only';

import { redirect } from 'next/navigation';

import { dedupedAuth } from '@/lib/auth';
import { getLoginRedirect } from '@/lib/auth/redirect';
import { checkSession } from '@/lib/auth/session';

import {
  queryKnowledgeSourcesForAgent,
  type KnowledgeSourceItem
} from './knowledge-source-query';

export type { KnowledgeSourceItem } from './knowledge-source-query';

export async function getKnowledgeSources(
  agentId: string
): Promise<KnowledgeSourceItem[]> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    return redirect(getLoginRedirect());
  }

  return queryKnowledgeSourcesForAgent(agentId, session.user.organizationId);
}

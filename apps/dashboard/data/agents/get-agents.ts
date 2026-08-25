import 'server-only';

import { unstable_cache as cache } from 'next/cache';
import { redirect } from 'next/navigation';
import type {
  CharacterType,
  EmojiMode,
  Formality,
  IndustryType,
  OpenerStyle,
  Verbosity
} from '@prisma/client';

import {
  Caching,
  dynamicListRevalidateTimeInSeconds,
  OrganizationCacheKey
} from '@/data/caching';
import { excludeDemoAgentsUnlessAdmin } from '@/lib/admin-demos/demo-agent-list-where';
import { dedupedAuth } from '@/lib/auth';
import { isAdmin } from '@/lib/auth/permissions';
import { getLoginRedirect } from '@/lib/auth/redirect';
import { checkSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

export type AgentListItem = {
  id: string;
  publicId: string;
  name: string;
  role: string;
  character: CharacterType;
  customCharacterPrompt: string | null;
  industry: IndustryType;
  verbosity: Verbosity;
  formality: Formality;
  emojiMode: EmojiMode;
  openerStyle: OpenerStyle;
  allowTypos: boolean;
  fallbackMessage: string;
  greetingMessage: string | null;
  image: string | null;
  showRole: boolean;
  isPaused: boolean;
  forbiddenTopics: string[];
  guardrailsEnabled: boolean;
};

export async function getAgents(): Promise<AgentListItem[]> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    return redirect(getLoginRedirect());
  }

  const includeDemos = await isAdmin(session.user.id);

  return cache(
    async () => {
      return prisma.agent.findMany({
        where: {
          organizationId: session.user.organizationId,
          ...excludeDemoAgentsUnlessAdmin(includeDemos)
        },
        select: {
          id: true,
          publicId: true,
          name: true,
          role: true,
          character: true,
          customCharacterPrompt: true,
          industry: true,
          verbosity: true,
          formality: true,
          emojiMode: true,
          openerStyle: true,
          allowTypos: true,
          fallbackMessage: true,
          greetingMessage: true,
          image: true,
          showRole: true,
          isPaused: true,
          forbiddenTopics: true,
          guardrailsEnabled: true
        },
        orderBy: { createdAt: 'desc' }
      });
    },
    Caching.createOrganizationKeyParts(
      OrganizationCacheKey.Agents,
      session.user.organizationId,
      includeDemos ? 'list-admin' : 'list'
    ),
    {
      revalidate: dynamicListRevalidateTimeInSeconds,
      tags: [
        Caching.createOrganizationTag(
          OrganizationCacheKey.Agents,
          session.user.organizationId
        )
      ]
    }
  )();
}

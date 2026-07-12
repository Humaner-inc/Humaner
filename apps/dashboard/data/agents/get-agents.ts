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
import { dedupedAuth } from '@/lib/auth';
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
};

export async function getAgents(): Promise<AgentListItem[]> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    return redirect(getLoginRedirect());
  }

  return cache(
    async () => {
      return prisma.agent.findMany({
        where: { organizationId: session.user.organizationId },
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
          forbiddenTopics: true
        },
        orderBy: { createdAt: 'desc' }
      });
    },
    Caching.createOrganizationKeyParts(
      OrganizationCacheKey.Agents,
      session.user.organizationId,
      'list'
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

import 'server-only';

import type { SystemPromptAgent } from '@/lib/build-system-prompt';
import { prisma } from '@/lib/db/prisma';
import { cacheDelete, cacheGet, cacheSet } from '@/lib/redis/upstash';

const CACHE_PREFIX = 'agent:chat:';
const CACHE_TTL_SECONDS = 3_600;

export type CachedChatAgent = SystemPromptAgent & {
  id: string;
  publicId: string;
  isPaused: boolean;
  allowedDomains: string[];
  organizationId: string;
  organization: {
    tier: string;
    email: string | null;
    supportEmail: string | null;
    humanDeskEnabled: boolean;
  } | null;
};

const agentSelect = {
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
  forbiddenTopics: true,
  fallbackMessage: true,
  isPaused: true,
  allowedDomains: true,
  organizationId: true,
  organization: {
    select: {
      tier: true,
      email: true,
      supportEmail: true,
      humanDeskEnabled: true
    }
  }
} as const;

function cacheKey(publicId: string): string {
  return `${CACHE_PREFIX}${publicId}`;
}

export async function getAgentForChat(
  publicId: string
): Promise<CachedChatAgent | null> {
  const key = cacheKey(publicId);
  const cached = await cacheGet<CachedChatAgent>(key);
  if (cached) {
    return cached;
  }

  const agent = await prisma.agent.findUnique({
    where: { publicId },
    select: agentSelect
  });

  if (!agent) {
    return null;
  }

  void cacheSet(key, agent, CACHE_TTL_SECONDS);
  return agent as CachedChatAgent;
}

export async function invalidateAgentConfigCache(
  publicId: string
): Promise<void> {
  await cacheDelete(cacheKey(publicId));
}

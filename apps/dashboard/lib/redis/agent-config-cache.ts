import 'server-only';

import { getVerticalPersonaPreset } from '@/services/training/verticals';
import { getPlanCapabilities } from '@humaner/shared/plans';
import type { IndustryType } from '@prisma/client';

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

type AgentChatRow = {
  id: string;
  publicId: string;
  name: string;
  role: string;
  character: SystemPromptAgent['character'];
  customCharacterPrompt: string | null;
  industry: IndustryType;
  verbosity: SystemPromptAgent['verbosity'];
  formality: SystemPromptAgent['formality'];
  emojiMode: SystemPromptAgent['emojiMode'];
  openerStyle: SystemPromptAgent['openerStyle'];
  allowTypos: boolean;
  forbiddenTopics: string[];
  fallbackMessage: string;
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

function toCachedChatAgent(row: AgentChatRow): CachedChatAgent {
  const persona = getVerticalPersonaPreset(row.industry);
  const tier = row.organization?.tier ?? 'free';

  return {
    id: row.id,
    publicId: row.publicId,
    name: row.name,
    role: row.role,
    character: row.character,
    customCharacterPrompt: row.customCharacterPrompt,
    industry: row.industry,
    verbosity: row.verbosity,
    formality: row.formality,
    emojiMode: row.emojiMode,
    openerStyle: row.openerStyle,
    allowTypos: row.allowTypos,
    typoExceptions: persona.typoExceptions,
    forbiddenTopics: row.forbiddenTopics,
    fallbackMessage: row.fallbackMessage,
    isPaused: row.isPaused,
    allowedDomains: row.allowedDomains,
    organizationId: row.organizationId,
    organization: row.organization,
    hasCrossSessionMemory: getPlanCapabilities(tier).memory === 'cross-session'
  };
}

function backfillCachedAgent(cached: CachedChatAgent): CachedChatAgent {
  if (cached.typoExceptions && cached.hasCrossSessionMemory !== undefined) {
    return cached;
  }
  const persona = getVerticalPersonaPreset(cached.industry);
  const tier = cached.organization?.tier ?? 'free';
  return {
    ...cached,
    typoExceptions: cached.typoExceptions ?? persona.typoExceptions,
    hasCrossSessionMemory:
      cached.hasCrossSessionMemory ??
      getPlanCapabilities(tier).memory === 'cross-session'
  };
}

export async function getAgentForChat(
  publicId: string
): Promise<CachedChatAgent | null> {
  const key = cacheKey(publicId);
  const cached = await cacheGet<CachedChatAgent>(key);
  if (cached) {
    return backfillCachedAgent(cached);
  }

  const agent = await prisma.agent.findUnique({
    where: { publicId },
    select: agentSelect
  });

  if (!agent) {
    return null;
  }

  const hydrated = toCachedChatAgent(agent);
  void cacheSet(key, hydrated, CACHE_TTL_SECONDS);
  return hydrated;
}

export async function invalidateAgentConfigCache(
  publicId: string
): Promise<void> {
  await cacheDelete(cacheKey(publicId));
}

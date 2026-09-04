/**
 * Self-Host (OSS) twin of `plans.ts`.
 *
 * Cloud prices, Polar product keys, volume quotes, and Frontier checkout stay
 * private. The public kit only exposes the Self-Host capability matrix and the
 * types the dashboard still imports. josh renames this onto `plans.ts`.
 */

export type PlanTier = "free" | "byo" | "classic" | "frontier" | "humaner";

export type LlmModelId =
  | "claude-sonnet-4-6"
  | "claude-sonnet-4-5"
  | "claude-haiku-4-5-20251001";

export type HumanerModelVersion = "v1.0" | "v2.0" | "v3.0";

export type HumanerModelDefinition = {
  version: HumanerModelVersion;
  label: string;
  tagline: string;
};

export const HUMANER_MODELS: Record<
  HumanerModelVersion,
  HumanerModelDefinition
> = {
  "v1.0": {
    version: "v1.0",
    label: "Humaner v1.0",
    tagline:
      "Fast replies from your knowledge with semantic dedup and session memory.",
  },
  "v2.0": {
    version: "v2.0",
    label: "Humaner v2.0",
    tagline:
      "Cross-session memory for identified visitors, with session context and knowledge-backed replies.",
  },
  "v3.0": {
    version: "v3.0",
    label: "Humaner v3.0",
    tagline:
      "Full learning loop with live data, voice, and enterprise controls.",
  },
};

export type PlanFeature = {
  label: string;
  description?: string;
  included: boolean;
};

export type MemoryMode = "none" | "session" | "cross-session";

export type PersonalityAccess = "corporate-only" | "custom-only" | "all";

export type PlanCapabilities = {
  langCache: boolean;
  memory: MemoryMode;
  personalization: boolean;
  personalities: PersonalityAccess;
  contentGaps: boolean;
  autoTraining: boolean;
  humanDeskEmail: boolean;
  agentDesk: boolean;
  liveChat: boolean;
  apiAccess: boolean;
  liveData: boolean;
  removeWatermark: boolean;
  runbooks: boolean;
  copilot: boolean;
  hostedAgent: boolean;
};

export const SELF_HOST_CAPABILITIES: PlanCapabilities = {
  langCache: false,
  memory: "none",
  personalization: false,
  personalities: "custom-only",
  contentGaps: false,
  autoTraining: false,
  humanDeskEmail: true,
  agentDesk: false,
  liveChat: false,
  apiAccess: true,
  liveData: false,
  removeWatermark: true,
  runbooks: false,
  copilot: false,
  hostedAgent: true,
};

/** Dashboard shell still reads this; Self-Host never shows the Cloud prompt. */
export const FRONTIER_PLAN_COMING_SOON = false;

export type PlanCapabilityContext = {
  frontierBetaEnabled?: boolean | null;
};

export function getPlanCapabilities(
  _tier: string,
  _context?: PlanCapabilityContext,
): PlanCapabilities {
  return SELF_HOST_CAPABILITIES;
}

export type PlanDefinition = {
  tier: PlanTier;
  name: string;
  tagline: string;
  includedMessages: number;
  overagePerMessage: number | null;
  freeTrainingMessages: number;
  agents: number;
  members: number;
  mailboxAliases: number;
  model: LlmModelId;
  modelLabel: string;
  humanerModel: HumanerModelDefinition;
  maxContextTokens: number;
  maxHistoryTurns: number;
  features: PlanFeature[];
  highlighted?: boolean;
};

export const UNLIMITED_AGENTS = 999;

export const LLM_MODELS = {
  SONNET_46: {
    id: "claude-sonnet-4-6" as const,
    label: "Sonnet 4.6",
    description: "Accurate, brand-aware responses with full knowledge backing",
  },
  SONNET_45: {
    id: "claude-sonnet-4-5" as const,
    label: "Sonnet 4.5",
    description: "Reliable fallback model",
  },
  HAIKU_45: {
    id: "claude-haiku-4-5-20251001" as const,
    label: "Haiku 4.5",
    description: "Fast last-resort fallback",
  },
} as const;

export const LLM_FALLBACK_CHAIN: LlmModelId[] = [
  LLM_MODELS.SONNET_45.id,
  LLM_MODELS.HAIKU_45.id,
];

export const LLM_MODEL_FALLBACK_ID = LLM_MODELS.SONNET_45.id;

export const OPERATOR_OWNED_QUOTA_LABEL = "-";

export const SELF_HOST_PLAN: PlanDefinition = {
  tier: "free",
  name: "Self-Host",
  tagline: "Host your own customer support.",
  includedMessages: 1_000_000,
  overagePerMessage: null,
  freeTrainingMessages: 1_000,
  agents: UNLIMITED_AGENTS,
  members: UNLIMITED_AGENTS,
  mailboxAliases: 0,
  model: LLM_MODELS.SONNET_46.id,
  modelLabel: "Your model",
  humanerModel: HUMANER_MODELS["v1.0"],
  maxContextTokens: 16_384,
  maxHistoryTurns: 12,
  features: [
    {
      label: "Hybrid RAG",
      description:
        "Retrieve from your knowledge base — pgvector when configured, markdown files otherwise.",
      included: true,
    },
    {
      label: "Helpdesk",
      description: "Async handoff tickets for your team.",
      included: true,
    },
    {
      label: "Your LLM",
      description: "Custom system prompt, industry skills, and your LLM key.",
      included: true,
    },
    {
      label: "Team & org",
      description: "Members, roles, and invitations.",
      included: true,
    },
    {
      label: "Widget · API · React",
      description: "Embed and call your own deployment.",
      included: true,
    },
  ],
};

export function isSelfHostPricingPlan(plan: PlanDefinition): boolean {
  return plan.name === "Self-Host";
}

export function isOperatorOwnedQuotaPlan(_plan: PlanDefinition): boolean {
  return true;
}

export function formatPlanIncludedMessages(plan: PlanDefinition): string {
  if (isOperatorOwnedQuotaPlan(plan)) return OPERATOR_OWNED_QUOTA_LABEL;
  return formatMessages(plan.includedMessages);
}

export function formatPlanAgents(plan: PlanDefinition): string {
  if (isOperatorOwnedQuotaPlan(plan)) return OPERATOR_OWNED_QUOTA_LABEL;
  return formatAgents(plan.agents);
}

export function formatPlanMembers(plan: PlanDefinition): string {
  if (isSelfHostPricingPlan(plan)) return OPERATOR_OWNED_QUOTA_LABEL;
  return String(plan.members);
}

export function normalizePlanTier(tier: string): PlanTier {
  const normalized = tier.toLowerCase();
  if (
    normalized === "refined" ||
    normalized === "grow" ||
    normalized === "native"
  ) {
    return "classic";
  }
  if (
    normalized === "free" ||
    normalized === "byo" ||
    normalized === "classic" ||
    normalized === "frontier" ||
    normalized === "humaner"
  ) {
    return normalized;
  }
  return "free";
}

export function getPlanForTier(_tier: string): PlanDefinition {
  return SELF_HOST_PLAN;
}

export function getEffectivePlan(
  _tier: string,
  _includedMessages?: number | null,
): PlanDefinition {
  return SELF_HOST_PLAN;
}

export function getLlmModelLabel(modelId: LlmModelId): string {
  const match = Object.values(LLM_MODELS).find((model) => model.id === modelId);
  return match?.label ?? modelId;
}

export function formatAgents(count: number): string {
  if (count >= UNLIMITED_AGENTS) return "Unlimited";
  return String(count);
}

export function formatMessages(count: number): string {
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(count % 1_000 === 0 ? 0 : 1)}k`;
  }
  return count.toLocaleString();
}

export function formatMailboxAliases(count: number): string | false {
  if (count <= 0) return false;
  return count === 1 ? "1 inbox" : `${count} inboxes`;
}
